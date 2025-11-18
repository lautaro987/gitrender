import React, { useState, useEffect } from 'react';


export default function App(){
const [file, setFile] = useState(null);
const [name, setName] = useState('');
const [sites, setSites] = useState([]);


useEffect(()=>{ fetch('/api/sites').then(r=>r.json()).then(setSites); }, []);


const upload = async () => {
if(!file) return alert('Elige un zip con tu proyecto');
const fd = new FormData();
fd.append('repo', file);
fd.append('name', name);
const res = await fetch('/api/upload', { method: 'POST', body: fd });
const data = await res.json();
if (data.id) {
alert('Deploy creado: ' + data.url);
setSites([ { id: data.id, name: name || data.id }, ...sites ]);
} else alert('Error');
}


return (
<div className="p-6 max-w-3xl mx-auto">
<h1 className="text-2xl font-bold mb-4">GitRender (demo)</h1>
<div className="mb-4">
<input type="text" placeholder="Nombre del sitio" value={name} onChange={e=>setName(e.target.value)} className="border p-2 mr-2" />
<input type="file" accept=".zip" onChange={e=>setFile(e.target.files[0])} />
<button onClick={upload} className="ml-2 px-4 py-2 rounded bg-sky-600 text-white">Subir y Deploy</button>
</div>


<h2 className="text-xl font-semibold mt-6">Sites recientes</h2>
<ul>
{sites.map(s=> (
<li key={s.id} className="py-2 border-b">
<a href={`/s/${s.id}/`} target="_blank" rel="noreferrer" className="text-sky-600">{s.name}</a>
</li>
))}
</ul>
</div>
);
}
