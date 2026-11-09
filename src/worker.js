const COOKIE = "uemp_session";
const SESSION_SECONDS = 60 * 60 * 8;
const corsHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const json = (data, status=200, extra={}) => new Response(JSON.stringify(data), {status, headers:{...corsHeaders,...extra}});
const id = () => crypto.randomUUID();
const enc = new TextEncoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const un64 = s => Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((s.length+3)%4)), c=>c.charCodeAt(0));
async function passwordMatches(password, salt, expected) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2",salt:un64(salt),iterations:310000,hash:"SHA-256"},key,256);
  const a = new Uint8Array(bits), b = un64(expected);
  return a.length===b.length && a.every((v,i)=>v===b[i]);
}
function cookieValue(request) {
  const raw=request.headers.get("Cookie")||"";
  const part=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
  return part ? decodeURIComponent(part.slice(COOKIE.length+1)) : null;
}

async function currentUser(request, env) {
  const token=cookieValue(request); if(!token) return null;
  const session=await env.KV.get("session:"+token,"json");
  if(!session) return null;
  return await env.DB.prepare("SELECT id,email,full_name,role,department_id FROM users WHERE id=? AND is_active=1").bind(session.userId).first();
}
async function audit(env, actor, action, type, entity, details={}) {
  await env.DB.prepare("INSERT INTO audit_logs(id,actor_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)")
    .bind(id(),actor?.id||null,action,type,String(entity),JSON.stringify(details)).run();
}
const fail=(message,status=400)=>json({ok:false,error:message},status);
async function body(request){try{return await request.json()}catch{return {}}}
async function requireUser(request,env,roles) {
  const user=await currentUser(request,env);
  if(!user) throw new Response(JSON.stringify({ok:false,error:"Authentication required"}),{status:401,headers:corsHeaders});
  if(roles && !roles.includes(user.role)) throw new Response(JSON.stringify({ok:false,error:"You do not have permission for this action"}),{status:403,headers:corsHeaders});
  return user;
}
async function api(request,env) {
  const url=new URL(request.url), path=url.pathname, method=request.method;
  if(method==="POST" && path==="/api/auth/login") {
    const data=await body(request), email=String(data.email||"").trim().toLowerCase(), password=String(data.password||"");
    if(!email || !password || password.length>200) return fail("Enter your email and password.");
    const user=await env.DB.prepare("SELECT id,email,full_name,password_salt,password_hash,role FROM users WHERE email=? AND is_active=1").bind(email).first();
    if(!user || !await passwordMatches(password,user.password_salt,user.password_hash)) return fail("Invalid email or password.",401);
    const token=b64(crypto.getRandomValues(new Uint8Array(32)));
    await env.KV.put("session:"+token,JSON.stringify({userId:user.id}),{expirationTtl:SESSION_SECONDS});
    await audit(env,user,"auth.login","session",token.slice(0,12));
    return json({ok:true,user:{id:user.id,email:user.email,name:user.full_name,role:user.role}},200,{"Set-Cookie":COOKIE+"="+encodeURIComponent(token)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+SESSION_SECONDS});
  }
  if(method==="POST" && path==="/api/auth/logout") {
    const token=cookieValue(request); if(token) await env.KV.delete("session:"+token);
    return json({ok:true},200,{"Set-Cookie":COOKIE+"=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"});
  }
  const user=await currentUser(request,env);
  if(method==="GET" && path==="/api/health") return json({ok:true,service:"UEMP",database:"connected"});
  if(method==="GET" && path==="/api/me") return user?json({ok:true,user:{id:user.id,email:user.email,name:user.full_name,role:user.role,department_id:user.department_id}}):fail("Authentication required",401);
  if(!user) return fail("Authentication required",401);

  if(method==="GET" && path==="/api/student/courses") {
    if(user.role!=="student") return fail("Forbidden",403);
    const rows=await env.DB.prepare(`SELECT o.id offering_id,c.code,c.title,c.units,c.level,
      CASE WHEN r.id IS NULL THEN 0 ELSE 1 END registered
      FROM course_offerings o JOIN courses c ON c.id=o.course_id
      JOIN semesters s ON s.id=o.semester_id AND s.is_current=1
      LEFT JOIN course_registrations r ON r.offering_id=o.id AND r.student_id=?
      JOIN students st ON st.user_id=? WHERE c.level=st.level ORDER BY c.code`).bind(user.id,user.id).all();
    return json({ok:true,courses:rows.results});
  }
  if(method==="POST" && path==="/api/student/register") {
    if(user.role!=="student") return fail("Forbidden",403);
    const {offeringIds=[]}=await body(request);
    if(!Array.isArray(offeringIds)||offeringIds.length>20) return fail("Invalid course selection.");
    const student=await env.DB.prepare("SELECT level FROM students WHERE user_id=?").bind(user.id).first();
    if(!student) return fail("Student profile not found",404);
    const current=await env.DB.prepare("SELECT id FROM semesters WHERE is_current=1").first();
    if(!current) return fail("No active semester is configured.");
    const existing=await env.DB.prepare("SELECT COUNT(*) n FROM course_registrations r JOIN course_offerings o ON o.id=r.offering_id WHERE r.student_id=? AND o.semester_id=?").bind(user.id,current.id).first();
    const unique=[...new Set(offeringIds.map(String))];
    if(existing.n+unique.length>30) return fail("Registration exceeds the 30-course safety limit.");
    const ops=[];
    for(const oid of unique){
      const valid=await env.DB.prepare("SELECT o.id FROM course_offerings o JOIN courses c ON c.id=o.course_id WHERE o.id=? AND o.semester_id=? AND c.level=? AND (SELECT COUNT(*) FROM course_registrations x WHERE x.offering_id=o.id)<o.capacity").bind(oid,current.id,student.level).first();
      if(!valid) return fail("One or more selected courses are unavailable for your level or are full.");
      ops.push(env.DB.prepare("INSERT OR IGNORE INTO course_registrations(id,student_id,offering_id) VALUES(?,?,?)").bind(id(),user.id,oid));
    }
    if(ops.length) await env.DB.batch(ops);
    await audit(env,user,"student.course_registration","course_registration",user.id,{offerings:unique});
    return json({ok:true,message:"Course registration saved."});
  }
  if(method==="GET" && path==="/api/student/registrations") {
    if(user.role!=="student") return fail("Forbidden",403);
    const rows=await env.DB.prepare("SELECT c.code,c.title,c.units,r.registered_at FROM course_registrations r JOIN course_offerings o ON o.id=r.offering_id JOIN courses c ON c.id=o.course_id JOIN semesters s ON s.id=o.semester_id AND s.is_current=1 WHERE r.student_id=? ORDER BY c.code").bind(user.id).all();
    return json({ok:true,registrations:rows.results,totalUnits:rows.results.reduce((a,x)=>a+x.units,0)});
  }
  if(method==="GET" && path==="/api/lecturer/courses") {
    if(!["lecturer","admin"].includes(user.role)) return fail("Forbidden",403);
    const rows=await env.DB.prepare("SELECT o.id offering_id,c.code,c.title,c.units,COALESCE(rs.status,'not_started') status FROM course_offerings o JOIN courses c ON c.id=o.course_id LEFT JOIN result_submissions rs ON rs.offering_id=o.id WHERE o.lecturer_id=? ORDER BY c.code").bind(user.id).all();
    return json({ok:true,courses:rows.results});
  }
  if(method==="GET" && path==="/api/lecturer/roster") {
    if(!["lecturer","admin"].includes(user.role)) return fail("Forbidden",403);
    const oid=url.searchParams.get("offering");
    const owned=await env.DB.prepare("SELECT id FROM course_offerings WHERE id=? AND lecturer_id=?").bind(oid,user.id).first();
    if(!owned) return fail("Course not assigned to you",403);
    const rows=await env.DB.prepare("SELECT st.user_id student_id,u.full_name,st.matric_no,re.ca_score,re.exam_score FROM course_registrations cr JOIN students st ON st.user_id=cr.student_id JOIN users u ON u.id=st.user_id LEFT JOIN result_submissions rs ON rs.offering_id=cr.offering_id LEFT JOIN result_entries re ON re.submission_id=rs.id AND re.student_id=st.user_id WHERE cr.offering_id=? ORDER BY st.matric_no").bind(oid).all();
    return json({ok:true,roster:rows.results});
  }
  if(method==="POST" && path==="/api/lecturer/results/save") {
    if(user.role!=="lecturer") return fail("Forbidden",403);
    const {offeringId,entries=[],submit=false}=await body(request);
    if(!Array.isArray(entries)||entries.length===0||entries.length>500) return fail("Result roster is empty or invalid.");
    const offering=await env.DB.prepare("SELECT id FROM course_offerings WHERE id=? AND lecturer_id=?").bind(offeringId,user.id).first();
    if(!offering) return fail("Course is not assigned to you",403);
    const old=await env.DB.prepare("SELECT id,status FROM result_submissions WHERE offering_id=?").bind(offeringId).first();
    if(old && !["draft","rejected","reopened"].includes(old.status)) return fail("Submitted results are locked. Ask an administrator to reopen them.",409);
    const submissionId=old?.id||id();
    const validStudents=await env.DB.prepare("SELECT student_id FROM course_registrations WHERE offering_id=?").bind(offeringId).all();
    const allowed=new Set(validStudents.results.map(x=>x.student_id));
    const statements=[];
    if(old) statements.push(env.DB.prepare("DELETE FROM result_entries WHERE submission_id=?").bind(submissionId));
    else statements.push(env.DB.prepare("INSERT INTO result_submissions(id,offering_id,lecturer_id,status) VALUES(?,?,?,'draft')").bind(submissionId,offeringId,user.id));
    for(const entry of entries){
      const ca=Number(entry.ca_score), exam=Number(entry.exam_score);
      if(!allowed.has(entry.student_id)||!Number.isFinite(ca)||!Number.isFinite(exam)||ca<0||ca>30||exam<0||exam>70) return fail("Invalid student or score. CA must be 0–30 and exam 0–70.");
      const total=ca+exam;
      const grade=await env.DB.prepare("SELECT grade,grade_point FROM grading_scales WHERE ? BETWEEN min_score AND max_score").bind(total).first();
      statements.push(env.DB.prepare("INSERT INTO result_entries(id,submission_id,student_id,ca_score,exam_score,total_score,grade,grade_point) VALUES(?,?,?,?,?,?,?,?)").bind(id(),submissionId,entry.student_id,ca,exam,total,grade.grade,grade.grade_point));
    }
    statements.push(env.DB.prepare("UPDATE result_submissions SET status=?,submitted_at=?,feedback=NULL WHERE id=?").bind(submit?"submitted":"draft",submit?new Date().toISOString():null,submissionId));
    await env.DB.batch(statements);
    await audit(env,user,submit?"lecturer.results.submit":"lecturer.results.save","result_submission",submissionId,{count:entries.length});
    return json({ok:true,message:submit?"Results submitted for departmental review.":"Draft saved."});
  }
  if(method==="GET" && path==="/api/admin/submissions") {
    if(!["admin","department_admin"].includes(user.role)) return fail("Forbidden",403);
    const scope=user.role==="department_admin"?" AND c.department_id=?":"";
    const stmt=env.DB.prepare("SELECT rs.id,rs.status,rs.submitted_at,c.code,c.title,u.full_name lecturer FROM result_submissions rs JOIN course_offerings o ON o.id=rs.offering_id JOIN courses c ON c.id=o.course_id JOIN users u ON u.id=rs.lecturer_id WHERE rs.status IN ('submitted','rejected','reopened')"+scope+" ORDER BY rs.submitted_at DESC").bind(...(scope?[user.department_id]:[]));
    const rows=await stmt.all(); return json({ok:true,submissions:rows.results});
  }
  if(method==="GET" && path==="/api/admin/submission") {
    if(!["admin","department_admin"].includes(user.role)) return fail("Forbidden",403);
    const sid=url.searchParams.get("id");
    const rows=await env.DB.prepare("SELECT re.student_id,u.full_name,st.matric_no,re.ca_score,re.exam_score,re.total_score,re.grade,re.grade_point FROM result_entries re JOIN students st ON st.user_id=re.student_id JOIN users u ON u.id=st.user_id WHERE re.submission_id=? ORDER BY st.matric_no").bind(sid).all();
    const scope=await env.DB.prepare("SELECT c.department_id FROM result_submissions rs JOIN course_offerings o ON o.id=rs.offering_id JOIN courses c ON c.id=o.course_id WHERE rs.id=?").bind(sid).first();
    if(!scope || (user.role==="department_admin" && scope.department_id!==user.department_id)) return fail("Submission not found",404);
    return json({ok:true,entries:rows.results});
  }
  if(method==="POST" && path==="/api/admin/review") {
    if(!["admin","department_admin"].includes(user.role)) return fail("Forbidden",403);
    const {submissionId,decision,feedback=""}=await body(request);
    if(!["approve","reject","reopen"].includes(decision)) return fail("Invalid review action.");
    const row=await env.DB.prepare("SELECT rs.id,rs.status,c.department_id FROM result_submissions rs JOIN course_offerings o ON o.id=rs.offering_id JOIN courses c ON c.id=o.course_id WHERE rs.id=?").bind(submissionId).first();
    if(!row || (user.role==="department_admin" && row.department_id!==user.department_id)) return fail("Submission not found",404);
    const next=decision==="approve"?"approved":decision==="reject"?"rejected":"reopened";
    if(decision==="approve" && row.status!=="submitted") return fail("Only submitted results can be approved.",409);
    if(decision==="reject" && row.status!=="submitted") return fail("Only submitted results can be rejected.",409);
    await env.DB.prepare("UPDATE result_submissions SET status=?,feedback=?,reviewed_by=?,reviewed_at=? WHERE id=?").bind(next,String(feedback).slice(0,1000),user.id,new Date().toISOString(),submissionId).run();
    await audit(env,user,"admin.results."+decision,"result_submission",submissionId,{feedback});
    return json({ok:true,message:"Review action recorded."});
  }
  if(method==="GET" && path==="/api/student/results") {
    if(user.role!=="student") return fail("Forbidden",403);
    const rows=await env.DB.prepare("SELECT c.code,c.title,c.units,re.total_score,re.grade,re.grade_point FROM result_entries re JOIN result_submissions rs ON rs.id=re.submission_id AND rs.status='approved' JOIN course_offerings o ON o.id=rs.offering_id JOIN courses c ON c.id=o.course_id WHERE re.student_id=? ORDER BY c.code").bind(user.id).all();
    const units=rows.results.reduce((a,x)=>a+x.units,0), weighted=rows.results.reduce((a,x)=>a+x.units*x.grade_point,0);
    return json({ok:true,results:rows.results,cgpa:units?Number((weighted/units).toFixed(2)):null});
  }
  if(method==="GET" && path==="/api/admin/overview") {
    if(!["admin","department_admin"].includes(user.role)) return fail("Forbidden",403);
    const [students,lecturers,courses,pending]=await Promise.all([
      env.DB.prepare("SELECT COUNT(*) n FROM students").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM lecturers").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM courses").first(),
      env.DB.prepare("SELECT COUNT(*) n FROM result_submissions rs JOIN course_offerings o ON o.id=rs.offering_id JOIN courses c ON c.id=o.course_id WHERE rs.status='submitted'"+(user.role==="department_admin"?" AND c.department_id=?":"")).bind(...(user.role==="department_admin"?[user.department_id]:[])).first()
    ]);
    return json({ok:true,stats:{students:students.n,lecturers:lecturers.n,courses:courses.n,pending:pending.n}});
  }
  if(method==="GET" && path==="/api/student/statement") {
    if(user.role!=="student") return fail("Forbidden",403);
    const rows=await env.DB.prepare("SELECT c.code,c.title,c.units,re.total_score,re.grade,re.grade_point FROM result_entries re JOIN result_submissions rs ON rs.id=re.submission_id AND rs.status='approved' JOIN course_offerings o ON o.id=rs.offering_id JOIN courses c ON c.id=o.course_id WHERE re.student_id=? ORDER BY c.code").bind(user.id).all();
    return json({ok:true,results:rows.results});
  }
  return fail("Endpoint not found",404);
}
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#24133f"><title>UEMP · University Portal</title><style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#201a2d;background:#f6f4fa;font-synthesis:none}*{box-sizing:border-box}body{margin:0}.shell{min-height:100vh}.top{background:#24133f;color:white;padding:18px max(22px,calc((100% - 1180px)/2));display:flex;justify-content:space-between;align-items:center}.brand{font-size:20px;font-weight:800;letter-spacing:-.5px}.brand span{color:#c8a8ff}.top small{color:#cbbddd}.wrap{max-width:1180px;margin:36px auto;padding:0 22px}.hero{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:26px}.eyebrow{color:#7654a5;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px}.hero h1{font-size:32px;margin:8px 0 5px;letter-spacing:-1px}.muted{color:#786f86}.panel,.stat{background:white;border:1px solid #ebe6f2;border-radius:16px;padding:22px;box-shadow:0 8px 26px #28183b08}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:22px 0}.stat strong{font-size:28px;display:block;margin-top:7px}.stat span{font-size:13px;color:#786f86}.layout{display:grid;grid-template-columns:1fr 1fr;gap:18px}.btn{border:0;border-radius:10px;padding:11px 16px;background:#6d3cb0;color:white;font-weight:700;cursor:pointer}.btn.secondary{background:#eee8f7;color:#4a2d70}.btn.danger{background:#a63b4b}.btn:disabled{opacity:.5;cursor:not-allowed}input,select{width:100%;padding:12px;border:1px solid #ddd5e8;border-radius:9px;font:inherit;margin:6px 0 14px}label{font-size:13px;font-weight:700}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:12px 9px;border-bottom:1px solid #eee9f3}th{font-size:12px;text-transform:uppercase;color:#756b83}td input{margin:0;min-width:76px}.notice{padding:12px;border-radius:10px;background:#f0eafb;color:#4e3474;margin:12px 0}.hidden{display:none}.login{max-width:430px;margin:7vh auto}.actions{display:flex;gap:8px;flex-wrap:wrap}.section{margin-top:20px}.pill{background:#eee8f7;color:#563b7c;border-radius:20px;padding:5px 9px;font-size:12px}.row{display:flex;justify-content:space-between;gap:14px;align-items:center}.error{color:#a22}.success{color:#246b47}@media(max-width:760px){.grid{grid-template-columns:repeat(2,1fr)}.layout{grid-template-columns:1fr}.hero{display:block}.hero h1{font-size:26px}.wrap{margin:24px auto}.top{padding:16px 20px}}
</style></head><body><header class="top"><div class="brand">UEMP<span>.</span></div><small id="topuser">University Education Management Portal</small></header><main class="wrap"><section id="login" class="login panel"><div class="eyebrow">Welcome back</div><h1>Sign in to your portal</h1><p class="muted">Access course registration, results and academic administration.</p><form id="loginform" method="post" action="/login"><label>Email address</label><input name="email" type="email" placeholder="name@university.edu" required><label>Password</label><input name="password" type="password" required><button class="btn" style="width:100%">Sign in securely</button></form><div id="loginmsg" class="muted"></div><p class="muted" style="font-size:12px">Demo environment · Use the test accounts in the project README.</p></section><section id="app" class="hidden"><div class="hero"><div><div class="eyebrow" id="rolelabel">Academic workspace</div><h1 id="welcome">Dashboard</h1><div class="muted">A unified workspace for academic services.</div></div><div class="actions"><button class="btn secondary" onclick="load()">Refresh</button><button class="btn secondary" onclick="logout()">Sign out</button></div></div><div id="stats" class="grid"></div><div id="content" class="panel">Loading workspace…</div></section><div id="toast"></div></main><script>
let me=null, currentOffering=null;
const el=id=>document.getElementById(id);\nconst esc=value=>String(value??'').replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[ch]));
async function api(path,opts={}){const r=await fetch(path,{...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d}
function msg(t,good=false){el('toast').innerHTML='<div class="notice '+(good?'success':'error')+'">'+t+'</div>';setTimeout(()=>el('toast').innerHTML='',4500)}
document.getElementById('loginform').onsubmit=async e=>{e.preventDefault();el('loginmsg').textContent='Signing in…';try{const d=await api('/api/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});me=d.user;await load()}catch(err){el('loginmsg').textContent=err.message}};
async function logout(){await api('/api/auth/logout',{method:'POST'});me=null;el('app').classList.add('hidden');el('login').classList.remove('hidden')}
async function init(){try{const d=await api('/api/me');me=d.user;await load()}catch{el('login').classList.remove('hidden')}}
async function load(){if(!me)return;el('login').classList.add('hidden');el('app').classList.remove('hidden');el('topuser').textContent=me.name+' · '+me.role.replace('_',' ');el('welcome').textContent='Hello, '+me.name.split(' ')[0];el('rolelabel').textContent=me.role.replace('_',' ')+' workspace';if(me.role==='student')return student();if(me.role==='lecturer')return lecturer();return admin()}
async function student(){const [c,r,results]=await Promise.all([api('/api/student/courses'),api('/api/student/registrations'),api('/api/student/results')]);el('stats').innerHTML='<div class="stat"><span>Registered courses</span><strong>'+r.registrations.length+'</strong></div><div class="stat"><span>Credit units</span><strong>'+r.totalUnits+'</strong></div><div class="stat"><span>Published results</span><strong>'+results.results.length+'</strong></div><div class="stat"><span>Current CGPA</span><strong>'+(results.cgpa??'—')+'</strong></div>';el('content').innerHTML='<div class="row"><h2>Course registration</h2><span class="pill">2025/2026 · First Semester</span></div><p class="muted">Choose courses available for your programme level. Duplicate registrations are prevented.</p><div id="courses">'+c.courses.map(x=>'<label style="display:flex;gap:10px;align-items:center;padding:10px;border-bottom:1px solid #eee"><input style="width:auto;margin:0" type="checkbox" value="'+esc(x.offering_id)+'" '+(x.registered?'checked disabled':'')+'><span style="flex:1"><b>'+esc(x.code)+'</b> · '+esc(x.title)+'</span><span class="pill">'+esc(x.units)+' units</span></label>').join('')+'</div><div class="actions section"><button class="btn" onclick="registerCourses()">Save registration</button><button class="btn secondary" onclick="window.print()">Print statement</button></div><div class="section"><h2>Published results</h2>'+table(results.results,['code','title','units','total_score','grade'])+'</div>'}
async function registerCourses(){const offeringIds=[...document.querySelectorAll('#courses input:checked:not(:disabled)')].map(x=>x.value);try{const d=await api('/api/student/register',{method:'POST',body:JSON.stringify({offeringIds})});msg(d.message,true);await student()}catch(e){msg(e.message)}}
function table(rows,cols){if(!rows.length)return '<p class="muted">No records to display yet.</p>';return '<div style="overflow:auto"><table><thead><tr>'+cols.map(c=>'<th>'+c.replace('_',' ')+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(r[c]??'—')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
async function lecturer(){const d=await api('/api/lecturer/courses');el('stats').innerHTML='<div class="stat"><span>Assigned courses</span><strong>'+d.courses.length+'</strong></div>';el('content').innerHTML='<h2>My assigned courses</h2>'+d.courses.map(x=>'<div class="row" style="padding:14px 0;border-bottom:1px solid #eee"><div><b>'+esc(x.code)+'</b> · '+esc(x.title)+'<div class="muted">'+esc(x.units)+' credit units · '+esc(x.status)+'</div></div><button class="btn" onclick="openRoster(\''+esc(x.offering_id)+'\')">Enter results</button></div>').join('')+'<div id="roster" class="section"></div>'}
async function openRoster(oid){currentOffering=oid;const d=await api('/api/lecturer/roster?offering='+encodeURIComponent(oid));el('roster').innerHTML='<h2>Student results</h2><p class="muted">Continuous assessment is out of 30; examination is out of 70. Grades calculate automatically when saved.</p><div style="overflow:auto"><table><thead><tr><th>Matric no.</th><th>Student</th><th>CA / 30</th><th>Exam / 70</th></tr></thead><tbody>'+d.roster.map(x=>'<tr data-student="'+x.student_id+'"><td>'+x.matric_no+'</td><td>'+x.full_name+'</td><td><input class="ca" type="number" min="0" max="30" value="'+(x.ca_score??'')+'"></td><td><input class="exam" type="number" min="0" max="70" value="'+(x.exam_score??'')+'"></td></tr>').join('')+'</tbody></table></div><div class="actions section"><button class="btn secondary" onclick="saveResults(false)">Save draft</button><button class="btn" onclick="saveResults(true)">Submit to department</button></div>'}
async function saveResults(submit){const entries=[...document.querySelectorAll('#roster tr[data-student]')].map(r=>({student_id:r.dataset.student,ca_score:r.querySelector('.ca').value,exam_score:r.querySelector('.exam').value}));try{const d=await api('/api/lecturer/results/save',{method:'POST',body:JSON.stringify({offeringId:currentOffering,entries,submit})});msg(d.message,true);await lecturer()}catch(e){msg(e.message)}}
async function admin(){const [o,s]=await Promise.all([api('/api/admin/overview'),api('/api/admin/submissions')]);el('stats').innerHTML=Object.entries(o.stats).map(([k,v])=>'<div class="stat"><span>'+k+'</span><strong>'+v+'</strong></div>').join('');el('content').innerHTML='<h2>Departmental result review</h2><p class="muted">Review submitted score sheets. Approval publishes results to student accounts.</p>'+s.submissions.map(x=>'<div class="row" style="padding:14px 0;border-bottom:1px solid #eee"><div><b>'+esc(x.code)+'</b> · '+esc(x.title)+'<div class="muted">Lecturer: '+esc(x.lecturer)+' · '+esc(x.status)+'</div></div><button class="btn" onclick="review(\''+esc(x.id)+'\')">Review</button></div>').join('')+'<div id="reviewbox" class="section"></div>'}
async function review(id){const d=await api('/api/admin/submission?id='+encodeURIComponent(id));el('reviewbox').innerHTML='<h3>Score sheet</h3>'+table(d.entries,['matric_no','full_name','ca_score','exam_score','total_score','grade'])+'<label>Feedback (required when rejecting)</label><input id="feedback" placeholder="Enter review feedback"><div class="actions"><button class="btn" onclick="decision(\''+id+'\',\'approve\')">Approve & publish</button><button class="btn danger" onclick="decision(\''+id+'\',\'reject\')">Reject</button><button class="btn secondary" onclick="decision(\''+id+'\',\'reopen\')">Reopen</button></div>'}
async function decision(id,decision){try{const feedback=el('feedback')?.value||'';if(decision==='reject'&&!feedback.trim())return msg('Please provide feedback when rejecting.');const d=await api('/api/admin/review',{method:'POST',body:JSON.stringify({submissionId:id,decision,feedback})});msg(d.message,true);await admin()}catch(e){msg(e.message)}}
init();
</script></body></html>`;

async function formLogin(request,env) {
  let form;
  try { form=await request.formData(); } catch { return new Response("Invalid sign-in request.",{status:400}); }
  const email=String(form.get("email")||"").trim().toLowerCase();
  const password=String(form.get("password")||"");
  if(!email || !password || password.length>200) return new Response(page.replace('<div id="loginmsg" class="muted"></div>','<div id="loginmsg" class="error">Enter your email and password.</div>'),{status:400,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  const user=await env.DB.prepare("SELECT id,email,full_name,password_salt,password_hash,role FROM users WHERE email=? AND is_active=1").bind(email).first();
  if(!user || !await passwordMatches(password,user.password_salt,user.password_hash)) {
    const html=page.replace('<div id="loginmsg" class="muted"></div>','<div id="loginmsg" class="error">Invalid email or password. Please try again.</div>');
    return new Response(html,{status:401,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
  }
  const token=b64(crypto.getRandomValues(new Uint8Array(32)));
  await env.KV.put("session:"+token,JSON.stringify({userId:user.id}),{expirationTtl:SESSION_SECONDS});
  await audit(env,user,"auth.login","session",token.slice(0,12));
  return new Response(null,{status:303,headers:{"Location":"/","Cache-Control":"no-store","Set-Cookie":COOKIE+"="+encodeURIComponent(token)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+SESSION_SECONDS}});
}
\nexport default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if(url.pathname==="/login" && request.method==="POST") return formLogin(request,env);
  if(url.pathname.startsWith("/api/")) return api(request,env);
  if(request.method!=="GET") return new Response("Method not allowed",{status:405});
  return new Response(page,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","X-Frame-Options":"DENY","Content-Security-Policy":"default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}});
 }
};