"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShoppingCart, Coffee, ArrowLeft, RotateCcw, Edit3, X, Minus, Plus } from "lucide-react";

// --- KONEKSI DATABASE ---
const supabase = createClient(
  "https://tosaqkqmbdlumdtrbsqc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvc2Fxa3FtYmRsdW1kdHJic3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE0MjQsImV4cCI6MjA4MDUyNzQyNH0.pOYGd7-o1tQgbHRNmX8EA2bWo4Pp-Em7UOiurjo6OwI"
);

export default function AppKasirFinalHiddenBonus() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [view, setView] = useState("dashboard"); 
  const [menu, setMenu] = useState([]);
  const [keranjang, setKeranjang] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [editingTx, setEditingTx] = useState(null);
  const [isCrosscheck, setIsCrosscheck] = useState(false);
  const [stats, setStats] = useState({ omset: 0, untung: 0 });

  useEffect(() => {
    if (isLoggedIn) { fetchMenu(); fetchTransactions(); }
  }, [isLoggedIn]);

  // Statistik 24 Jam (Hanya menampilkan Omset & Untung)
  useEffect(() => {
    const data24J = allTransactions.filter(t => (new Date() - new Date(t.created_at)) < 86400000);
    setStats({
      omset: data24J.reduce((a, b) => a + (Number(b.total_omset) || 0), 0),
      untung: data24J.reduce((a, b) => a + (Number(b.total_untung) || 0), 0)
    });
  }, [allTransactions]);

  async function fetchMenu() {
    const { data } = await supabase.from("products").select("*").order('name');
    setMenu(data || []);
  }

  async function fetchTransactions() {
    const { data } = await supabase.from("transactions").select("*").order('created_at', { ascending: false }).limit(100);
    setAllTransactions(data || []);
  }

  const handleSimpan = async () => {
    const omset = keranjang.reduce((a, b) => a + (Number(b.harga_jual) * b.qty), 0);
    const untung = keranjang.reduce((a, b) => a + (Number(b.untung_tetap) * b.qty), 0);
    
    // Logika Bonus Tetap Dihitung untuk Database
    const bonus = keranjang.reduce((a, b) => a + (Number(b.bonus || 0) * b.qty), 0);

    const { error } = await supabase
      .from("transactions")
      .insert([{ 
        total_omset: omset, 
        total_untung: untung, 
        total_bonus: bonus, // Tetap tersimpan di DB
        items: keranjang 
      }]);

    if (error) {
      alert("GAGAL SIMPAN: " + error.message);
    } else {
      alert("✅ TRANSAKSI BERHASIL!");
      setKeranjang([]); setIsCrosscheck(false); setView("dashboard"); fetchTransactions();
    }
  };

  if (!isLoggedIn) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#fdf2e9' }}>
      <div style={{ background:'white', padding:'30px', borderRadius:'20px', textAlign:'center', width:'300px' }}>
        <Coffee size={50} color="#e67e22" style={{margin:'0 auto 15px'}}/>
        <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} style={{width:'100%', padding:'12px', marginBottom:'15px', borderRadius:'10px', border:'1px solid #ddd'}}/>
        <button onClick={()=>password==="caffe123" ? setIsLoggedIn(true) : alert("Salah!")} style={{width:'100%', padding:'12px', background:'#e67e22', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold'}}>MASUK</button>
      </div>
    </div>
  );

  if (view === "dashboard") return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily:'sans-serif' }}>
       <h1 style={{color:'#e67e22', marginBottom:'30px'}}>CAFFE POS</h1>
       
       <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:'15px', marginBottom:'25px' }}>
          <div style={{background:'white', padding:'15px', borderRadius:'12px', border:'1px solid #eee'}}>
            <small style={{color:'#888'}}>Omset 24J</small><br/><b>Rp {stats.omset.toLocaleString()}</b>
          </div>
          <div style={{background:'white', padding:'15px', borderRadius:'12px', border:'1px solid #eee'}}>
            <small style={{color:'#888'}}>Untung 24J</small><br/><b style={{color:'#27ae60'}}>Rp {stats.untung.toLocaleString()}</b>
          </div>
       </div>

       <button onClick={() => setView("pesanan")} style={{ width:'100%', padding:'30px', marginBottom:'15px', background:'#e67e22', color:'white', borderRadius:'15px', border:'none', fontSize:'18px', fontWeight:'bold' }}>PEMESANAN</button>
       <button onClick={() => setView("ralat")} style={{ width:'100%', padding:'30px', background:'#333', color:'white', borderRadius:'15px', border:'none', fontSize:'18px', fontWeight:'bold' }}>AUDIT / RALAT (2H)</button>
       <button onClick={() => setIsLoggedIn(false)} style={{marginTop:'50px', border:'none', background:'none', color:'#ccc'}}>Logout</button>
    </div>
  );

  if (view === "pesanan") {
    if (isCrosscheck) return (
      <div style={{ padding: '20px', fontFamily:'sans-serif' }}>
        <button onClick={() => setIsCrosscheck(false)} style={{padding:'10px', marginBottom:'20px', border:'none', background:'#eee', borderRadius:'10px'}}>⬅ Kembali</button>
        <h3>Ringkasan Pesanan</h3>
        {keranjang.map((it, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #eee' }}>
            <span>{it.name} x{it.qty}</span>
            <b>Rp {(it.harga_jual * it.qty).toLocaleString()}</b>
          </div>
        ))}
        <div style={{marginTop:'30px', padding:'20px', background:'#fdf2e9', borderRadius:'15px', textAlign:'right'}}>
            <b style={{fontSize:'28px', color:'#e67e22'}}>Total: Rp {keranjang.reduce((a,b)=>a+(b.harga_jual*b.qty),0).toLocaleString()}</b>
        </div>
        <button onClick={handleSimpan} style={{ width:'100%', padding:'25px', marginTop:'30px', background:'#27ae60', color:'white', borderRadius:'15px', border:'none', fontSize:'20px', fontWeight:'bold' }}>KONFIRMASI & SIMPAN</button>
      </div>
    );

    return (
      <div style={{ padding: '15px', fontFamily:'sans-serif' }}>
        <button onClick={() => setView("dashboard")} style={{border:'none', background:'#eee', padding:'10px', borderRadius:'10px'}}>⬅ Dashboard</button>
        <div style={{ marginTop:'20px', paddingBottom:'120px' }}>
          {menu.map(m => (
            <div key={m.id} style={{ display:'flex', justifyContent:'space-between', padding:'15px', background:'white', marginBottom:'10px', borderRadius:'15px', border:'1px solid #eee' }}>
              <div><b>{m.name}</b><br/><small>Rp {m.harga_jual.toLocaleString()}</small></div>
              <div style={{ display:'flex', gap:'15px', alignItems:'center' }}>
                <button onClick={() => setKeranjang(prev => {
                    const ada = prev.find(x => x.id === m.id);
                    if (ada && ada.qty > 1) return prev.map(x => x.id === m.id ? {...ada, qty: ada.qty - 1} : x);
                    return prev.filter(x => x.id !== m.id);
                })} style={{width:'35px', height:'35px', borderRadius:'8px', border:'1px solid #ddd'}}>-</button>
                <b style={{width:'20px', textAlign:'center'}}>{keranjang.find(x => x.id === m.id)?.qty || 0}</b>
                <button onClick={() => setKeranjang(prev => {
                    const ada = prev.find(x => x.id === m.id);
                    if (ada) return prev.map(x => x.id === m.id ? {...ada, qty: ada.qty + 1} : x);
                    return [...prev, {...m, qty: 1}];
                })} style={{width:'35px', height:'35px', borderRadius:'8px', border:'none', background:'#e67e22', color:'white'}}>+</button>
              </div>
            </div>
          ))}
        </div>
        {keranjang.length > 0 && (
          <div style={{position:'fixed', bottom:0, left:0, right:0, background:'white', padding:'20px', borderTop:'1px solid #eee'}}>
            <button onClick={() => setIsCrosscheck(true)} style={{ width:'100%', padding:'20px', background:'#2980b9', color:'white', borderRadius:'15px', border:'none', fontWeight:'bold' }}>LIHAT RINGKASAN</button>
          </div>
        )}
      </div>
    );
  }

  if (view === "ralat") {
    const dataRalat = allTransactions.filter(t => (new Date() - new Date(t.created_at)) < 172800000);
    return (
      <div style={{ padding: '20px', fontFamily:'sans-serif' }}>
        <button onClick={() => setView("dashboard")} style={{border:'none', background:'#eee', padding:'10px', borderRadius:'10px'}}>⬅ Back</button>
        <h3 style={{margin:'20px 0'}}>Audit (2 Hari Terakhir)</h3>
        {dataRalat.map(t => (
          <div key={t.id} style={{ background: 'white', padding: '15px', borderRadius: '15px', marginBottom: '10px', border:'1px solid #eee' }}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
               <small style={{color:'#888'}}>{new Date(t.created_at).toLocaleString('id-ID')}</small>
               <button onClick={() => setEditingTx(JSON.parse(JSON.stringify(t)))} style={{color:'#e67e22', border:'none', background:'none', fontWeight:'bold'}}>Edit/Ralat</button>
            </div>
            {t.items.map((it, i) => <div key={i} style={{fontSize:'14px'}}>{it.name} x{it.qty}</div>)}
            <b style={{color:'#e67e22', display:'block', marginTop:'5px'}}>Total: Rp {Number(t.total_omset).toLocaleString()}</b>
          </div>
        ))}
        {editingTx && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding:'20px', zIndex:1000 }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '25px', width: '100%', maxWidth:'450px' }}>
              <h3 style={{marginTop:0}}>Revisi Unit</h3>
              {editingTx.items.map((it, idx) => (
                <div key={idx} style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                  <span>{it.name}</span>
                  <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <button onClick={() => { editingTx.items[idx].qty = Math.max(0, editingTx.items[idx].qty - 1); setEditingTx({...editingTx}); }} style={{width:'35px', height:'35px', borderRadius:'10px', border:'1px solid #ddd'}}>-</button>
                    <b>{editingTx.items[idx].qty}</b>
                    <button onClick={() => { editingTx.items[idx].qty += 1; setEditingTx({...editingTx}); }} style={{width:'35px', height:'35px', borderRadius:'10px', border:'1px solid #ddd'}}>+</button>
                  </div>
                </div>
              ))}
              <button onClick={async () => {
                let to = 0; let tu = 0; let tb = 0;
                editingTx.items.forEach(it => { to += (it.harga_jual * it.qty); tu += (it.untung_tetap * it.qty); tb += ((it.bonus || 0) * it.qty); });
                const { error } = await supabase.from("transactions").update({ items: editingTx.items, total_omset: to, total_untung: tu, total_bonus: tb }).eq('id', editingTx.id);
                if(!error){ alert("Berhasil Diupdate!"); setEditingTx(null); fetchTransactions(); }
              }} style={{width:'100%', marginTop:'20px', padding:'15px', background:'#27ae60', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold'}}>SIMPAN PERUBAHAN</button>
              <button onClick={()=>setEditingTx(null)} style={{width:'100%', marginTop:'10px', border:'none', background:'none', color:'red'}}>Batal</button>
            </div>
          </div>
        )}
      </div>
    );
  }
}