import { useState } from "react"
import { db } from "../firebase"
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"
import { ArrowLeft, Database, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

const products = [
  {
    name: "Syska 9W LED Bulb",
    price: 120,
    description: "Energy efficient LED bulb with 900 lumens brightness and 2 years warranty. B22 Base. 3D viewable.",
    category: "Lighting",
    image: "https://5.imimg.com/data5/SELLER/Default/2021/12/IB/WG/RM/47990105/syska-ssk-srl-9w-led-bulb-500x500.jpg",
    images: [
      "https://5.imimg.com/data5/SELLER/Default/2021/12/IB/WG/RM/47990105/syska-ssk-srl-9w-led-bulb-500x500.jpg",
      "https://placehold.co/600x600/png?text=LED+Bulb+View+1",
      "https://placehold.co/600x600/png?text=LED+Bulb+View+2"
    ],
    arModel: "/models/bulb.glb",
    stock: 100
  },
  {
    name: "Havells Fabio 6A Switch",
    price: 45,
    description: "Modular 6A 1-way switch with elegant design and high durability. Smooth operation. 3D viewable.",
    category: "Switches",
    image: "https://th.bing.com/th/id/OIP.nqXJR2_Hut7jZYungmYIvQHaHC?w=184&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.nqXJR2_Hut7jZYungmYIvQHaHC?w=184&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://placehold.co/600x600/png?text=Switch+Side+View"
    ],
    arModel: "/models/switch.glb",
    stock: 500
  },
  {
    name: "Finolex 1.5 sqmm Wire (90m)",
    price: 1850,
    description: "High-quality PVC insulated copper wire for domestic and industrial wiring. 90 Meter Roll. 3D viewable.",
    category: "Wires",
    image: "https://th.bing.com/th/id/OIP.shnygrogNhfyygRY_73J5QHaHa?w=213&h=213&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.shnygrogNhfyygRY_73J5QHaHa?w=213&h=213&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://placehold.co/600x600/png?text=Wire+Coil+Detail"
    ],
    arModel: "/models/wire.glb",
    stock: 50
  },
  {
    name: "Crompton High Speed Ceiling Fan",
    price: 2450,
    description: "48-inch high-speed ceiling fan with copper motor and aerodynamic blades. High RPM. 3D viewable.",
    category: "Fans",
    image: "https://th.bing.com/th/id/OIP.btu-zb-9XKfqNm-whfZuogHaHa?w=189&h=189&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.btu-zb-9XKfqNm-whfZuogHaHa?w=189&h=189&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://placehold.co/600x600/png?text=Ceiling+Fan+Blades"
    ],
    arModel: "/models/fan.glb",
    stock: 30
  },
  {
    name: "Schneider Electric 32A MCB",
    price: 380,
    description: "Single pole 32A Miniature Circuit Breaker for short circuit and overload protection. Reliable safety. 3D viewable.",
    category: "Switchgear",
    image: "https://th.bing.com/th/id/OIP.Q4gmzJfIsTl3guy7J_QKsgHaHa?w=176&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.Q4gmzJfIsTl3guy7J_QKsgHaHa?w=176&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://placehold.co/600x600/png?text=MCB+Internal+Mechanism"
    ],
    arModel: "/models/mcb.glb",
    stock: 150
  },
  {
    name: "Anchor Roma 3-Pin Socket",
    price: 85,
    description: "Standard 6A 3-pin modular socket with safety shutters. Durable polycarbonate material. 3D viewable.",
    category: "Switches",
    image: "https://th.bing.com/th/id/OIP.Nd_d8Lz7PUFSfuwC854UFAHaHa?w=178&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.Nd_d8Lz7PUFSfuwC854UFAHaHa?w=178&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://placehold.co/600x600/png?text=Socket+Back+View"
    ],
    arModel: "/models/3_pin_socket.glb",
    stock: 300
  },
  {
    name: "Wipro Smart LED Batten 20W",
    price: 450,
    description: "Smart Wi-Fi enabled 20W LED batten with tunable white and dimming options. Works with Alexa. 3D viewable.",
    category: "Lighting",
    image: "https://th.bing.com/th/id/OIP.ilJNNnUvS4qi9G1qgoGRqwHaHa?w=196&h=196&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.ilJNNnUvS4qi9G1qgoGRqwHaHa?w=196&h=196&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://m.media-amazon.com/images/I/61-mYjS985L._SL1100_.jpg"
    ],
    arModel: "/models/led_batten.glb",
    stock: 80
  },
  {
    name: "L&T Electrical Pump Control Box",
    price: 3200,
    description: "Digital control box for 1HP submersible pump with dry run protection. Heavy duty. 3D viewable.",
    category: "Industrial",
    image: "https://th.bing.com/th/id/OIP.klkOt1bN4-CG82dcf0jjVgHaHa?w=182&h=182&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.klkOt1bN4-CG82dcf0jjVgHaHa?w=182&h=182&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://m.media-amazon.com/images/I/71-mYjS985L._SL1100_.jpg"
    ],
    arModel: "/models/electrical_pump_control_box.glb",
    stock: 15
  },
  {
    name: "V-Guard VG 400 Voltage Stabilizer",
    price: 2150,
    description: "Digital voltage stabilizer for AC up to 1.5 Ton for protection against voltage fluctuations. 3D viewable.",
    category: "Appliances",
    image: "https://th.bing.com/th/id/OIP.c2hHYsyVfgi7TsDYvIutjgAAAA?w=181&h=181&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.c2hHYsyVfgi7TsDYvIutjgAAAA?w=181&h=181&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://m.media-amazon.com/images/I/51-mYjS985L._SL1100_.jpg"
    ],
    arModel: "/models/stabilizer.glb",
    stock: 25
  },
  {
    name: "Bajaj Majesty 16L OTG",
    price: 4200,
    description: "16-liter OTG with stainless steel body and heating element for versatile cooking. Compact design. 3D viewable.",
    category: "Appliances",
    image: "https://th.bing.com/th/id/OIP.5oNF_xva7aJ4nZGD8A8HXwHaFU?w=277&h=199&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.5oNF_xva7aJ4nZGD8A8HXwHaFU?w=277&h=199&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://m.media-amazon.com/images/I/61-mYjS985L._SL1100_.jpg"
    ],
    arModel: "/models/otg.glb",
    stock: 10
  },
  {
    name: "Philips 22W T5 LED Tubelight",
    price: 299,
    description: "Cool day light T5 LED tubelight for bright and uniform lighting. Energy efficient. 3D viewable.",
    category: "Lighting",
    image: "https://th.bing.com/th/id/OIP.QyPhPxJchM7dR6QrBEqPrAAAAA?w=177&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.QyPhPxJchM7dR6QrBEqPrAAAAA?w=177&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://m.media-amazon.com/images/I/51-mYjS985L._SL1100_.jpg"
    ],
    arModel: "/models/tubelight.glb",
    stock: 120
  },
  {
    name: "Polycab 2.5 sqmm Wire (90m)",
    price: 2850,
    description: "FR PVC insulated copper cables for enhanced safety in electrical circuits. High conductivity. 3D viewable.",
    category: "Wires",
    image: "https://th.bing.com/th/id/OIP.mHy4fhot4xXv2WSMNTE8RwHaHY?w=193&h=192&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.mHy4fhot4xXv2WSMNTE8RwHaHY?w=193&h=192&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://m.media-amazon.com/images/I/71-mYjS985L._SL1100_.jpg"
    ],
    arModel: "/models/wire.glb",
    stock: 40
  }
];

function SeedFirestore() {
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState(null)
  const { t } = useTranslation()

  const seedData = async () => {
    setStatus("loading")
    setError(null)
    try {
      console.log("Starting Firestore Seed...");
      // 1. Clear existing products
      const querySnapshot = await getDocs(collection(db, "products"))
      console.log(`Deleting ${querySnapshot.docs.length} existing products...`);
      for (const productDoc of querySnapshot.docs) {
        await deleteDoc(doc(db, "products", productDoc.id))
      }

      // 2. Add new products
      console.log(`Adding ${products.length} new products with 3D models...`);
      for (const product of products) {
        console.log(`Adding: ${product.name} (AR: ${product.arModel || 'No'})`);
        await addDoc(collection(db, "products"), product)
      }

      console.log("Seed Completed Successfully!");
      setStatus("success")
    } catch (err) {
      console.error(err)
      setError(err.message)
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${status === 'success' ? 'bg-emerald-50 text-emerald-500' : status === 'error' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}`}>
          {status === 'success' ? <CheckCircle size={40} /> : status === 'error' ? <AlertCircle size={40} /> : <Database size={40} />}
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">{t('seed.title')}</h1>
        <p className="text-slate-500 mb-10 font-medium">
          {t('seed.desc')}
        </p>

        {status === 'error' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={seedData}
            disabled={status === 'loading'}
            className="btn-primary w-full h-16 shadow-glow flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="animate-spin" size={20} />
                {t('seed.btn_loading')}
              </div>
            ) : status === 'success' ? (
              t('seed.btn_success')
            ) : (
              t('seed.btn_seed')
            )}
          </button>
          
          <Link to="/catalog" className="text-slate-400 font-bold hover:text-slate-900 transition-all text-sm flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            {t('seed.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SeedFirestore
