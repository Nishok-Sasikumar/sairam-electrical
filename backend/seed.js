const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const products = [
  {
    name: "Syska 9W LED Bulb",
    price: 120,
    description: "Energy efficient LED bulb with 900 lumens brightness and 2 years warranty. B22 Base.",
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
    description: "Modular 6A 1-way switch with elegant design and high durability. Smooth operation.",
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
    description: "High-quality PVC insulated copper wire for domestic and industrial wiring. 90 Meter Roll.",
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
    description: "48-inch high-speed ceiling fan with copper motor and aerodynamic blades. High RPM.",
    category: "Fans",
    image: "data:image/webp;base64,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",
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
    description: "Single pole 32A Miniature Circuit Breaker for short circuit and overload protection. Reliable safety.",
    category: "Switchgear",
    image: "https://th.bing.com/th/id/OIP.Q4gmzJfIsTl3guy7J_QKsgHaHa?w=176&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
    images: [
      "https://th.bing.com/th/id/OIP.Q4gmzJfIsTl3guy7J_QKsgHaHa?w=176&h=180&c=7&r=0&o=7&dpr=1.4&pid=1.7&rm=3",
      "https://placehold.co/600x600/png?text=MCB+Internal+Mechanism"
    ],
    arModel: "/models/MCB.glb",
    stock: 150
  },
  {
    name: "Anchor Roma 3-Pin Socket",
    price: 85,
    description: "Standard 6A 3-pin modular socket with safety shutters. Durable polycarbonate material.",
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
    description: "Smart Wi-Fi enabled 20W LED batten with tunable white and dimming options. Works with Alexa.",
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
    description: "Digital control box for 1HP submersible pump with dry run protection. Heavy duty.",
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
    description: "Digital voltage stabilizer for AC up to 1.5 Ton for protection against voltage fluctuations.",
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
    description: "16-liter OTG with stainless steel body and heating element for versatile cooking. Compact design.",
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
    description: "Cool day light T5 LED tubelight for bright and uniform lighting. Energy efficient.",
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
    description: "FR PVC insulated copper cables for enhanced safety in electrical circuits. High conductivity.",
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

const seedDB = async () => {
  try {
    await Product.deleteMany({});
    console.log("Existing products cleared.");
    await Product.insertMany(products);
    console.log("Database seeded with new products, multiple images, and accurate Bing URLs.");
    process.exit();
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
};

seedDB();
