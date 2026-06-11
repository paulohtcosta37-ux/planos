// JV Malhas Compressivas - Database Firestore Controller (with Local Fallback)
import { db, isMock } from "./firebase-config.js";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc,
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Lista de produtos iniciais estruturada a partir da tabela e catálogo reais
const initialProducts = [
  {
    id: "3004",
    code: "3004",
    name: "Calça Culote com Pernas (Fundo Aberto/Fechado)",
    description: "Ideal para pós-operatório de lipoaspiração de culote, coxas e abdômen. Tecido de alta compressão exclusivo Yoga, costuras reforçadas e abertura higiênica. Composição: 90% poliamida e 10% elastano.",
    price: 398.00,
    priceMedical: 278.60,
    line: "Premium",
    category: "calcas",
    gender: "feminino",
    stock: 25,
    images: [
      "./assets/images/products/product_3004_img2.jpeg",
      "./assets/images/products/product_3004_img1.jpeg",
      "./assets/images/products/product_3004_img7.jpeg"
    ]
  },
  {
    id: "3015",
    code: "3015",
    name: "Sutiã Pós-Cirúrgico Aberto Frente",
    description: "Sutiã para pós-operatório de mamoplastia, prótese de silicone e sustentação diária. Busto pré-moldado com acabamento em viés dobrável e fecho de colchetes frontal duplo. Confortável e seguro.",
    price: 217.00,
    priceMedical: 151.90,
    line: "Premium",
    category: "sutias",
    gender: "feminino",
    stock: 40,
    images: [
      "./assets/images/products/product_3015_img1.jpeg",
      "./assets/images/products/product_3015_img6.jpeg"
    ]
  },
  {
    id: "3009",
    code: "3009 YS AB",
    name: "Modelador Masculino com Pernas",
    description: "Modelador pós-cirúrgico masculino com abertura frontal por colchetes, fundo aberto e alças reforçadas. Ideal para pós-operatório de ginecomastia, lipoaspiração de abdômen e flancos.",
    price: 727.00,
    priceMedical: 508.90,
    line: "Premium",
    category: "modeladores",
    gender: "masculino",
    stock: 12,
    images: [
      "./assets/images/products/product_3009_img1.jpeg",
      "./assets/images/products/product_3009_img5.jpeg"
    ]
  },
  {
    id: "3075",
    code: "3075",
    name: "Faixa Abdominal com 12 Barbatanas",
    description: "Cinta abdominal com 12 barbatanas flexíveis que auxiliam na postura e modelação da cintura. Possui elástico de 12cm de reforço e fechamento frontal por colchetes em dupla regulagem.",
    price: 581.00,
    priceMedical: 406.70,
    line: "Premium",
    category: "cintas",
    gender: "feminino",
    stock: 18,
    images: [
      "./assets/images/products/product_3075_img1.jpeg",
      "./assets/images/products/product_3075_img2.jpeg"
    ]
  },
  {
    id: "3019",
    code: "3019",
    name: "Modelador Completo com Pernas",
    description: "Modelador pós-cirúrgico completo de alça larga e pernas com costura reforçada e abertura higiênica. Excelente compressão para abdômen, pernas e sustentação dos seios.",
    price: 717.00,
    priceMedical: 501.90,
    line: "Premium",
    category: "modeladores",
    gender: "feminino",
    stock: 15,
    images: [
      "./assets/images/products/product_3019_img1.jpeg",
      "./assets/images/products/product_3019_img5.jpeg"
    ]
  },
  {
    id: "3022",
    code: "3022",
    name: "Modelador sem Pernas e Aberto Frente",
    description: "Modelador curto estilo macaquinho (sem pernas), ideal para modelação do contorno corporal e uso estético diário. Busto pré-moldado que modela sem amassar, costuras confortáveis e fecho duplo.",
    price: 620.00,
    priceMedical: 434.00,
    line: "Premium",
    category: "modeladores",
    gender: "feminino",
    stock: 22,
    images: [
      "./assets/images/products/product_3022_img6.jpeg",
      "./assets/images/products/product_3022_img4.jpeg"
    ]
  }
];

// Inicialização de sementes locais (LocalStorage) ou Firestore
async function seedDatabase() {
  if (isMock) {
    if (!localStorage.getItem("jv_products")) {
      localStorage.setItem("jv_products", JSON.stringify(initialProducts));
      localStorage.setItem("jv_orders", JSON.stringify([]));
      console.log("JV Malhas: Banco de dados simulado inicializado no LocalStorage.");
    }
  } else {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      if (querySnapshot.empty) {
        console.log("Semeando banco de dados Firestore...");
        for (const p of initialProducts) {
          await setDoc(doc(db, "products", p.id), p);
        }
        console.log("Firestore semeado com sucesso!");
      }
    } catch (e) {
      console.error("Erro ao semear banco de dados Firestore:", e);
    }
  }
}

// Retorna todos os produtos
export async function getProducts() {
  await seedDatabase();
  if (isMock) {
    return JSON.parse(localStorage.getItem("jv_products") || "[]");
  } else {
    const querySnapshot = await getDocs(collection(db, "products"));
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return list;
  }
}

// Retorna um produto específico pelo ID
export async function getProductById(id) {
  if (isMock) {
    const products = JSON.parse(localStorage.getItem("jv_products") || "[]");
    return products.find(p => p.id === id) || null;
  } else {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }
}

// Cria um novo produto (Função do Painel Administrativo)
export async function addProduct(productData) {
  if (isMock) {
    const products = JSON.parse(localStorage.getItem("jv_products") || "[]");
    const newProduct = {
      id: productData.id || "prod_" + Date.now(),
      ...productData,
      stock: parseInt(productData.stock || 0),
      price: parseFloat(productData.price || 0),
      priceMedical: parseFloat(productData.priceMedical || 0)
    };
    products.push(newProduct);
    localStorage.setItem("jv_products", JSON.stringify(products));
    return newProduct;
  } else {
    const newProduct = {
      ...productData,
      stock: parseInt(productData.stock || 0),
      price: parseFloat(productData.price || 0),
      priceMedical: parseFloat(productData.priceMedical || 0)
    };
    await setDoc(doc(db, "products", newProduct.id), newProduct);
    return newProduct;
  }
}

// Atualiza o estoque de um produto
export async function updateProductStock(id, newStock) {
  if (isMock) {
    const products = JSON.parse(localStorage.getItem("jv_products") || "[]");
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].stock = parseInt(newStock);
      localStorage.setItem("jv_products", JSON.stringify(products));
      return true;
    }
    return false;
  } else {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, { stock: parseInt(newStock) });
    return true;
  }
}

// Salva um pedido de compra
export async function createOrder(orderData) {
  const finalOrder = {
    orderId: "JV-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toISOString(),
    status: "Pendente",
    ...orderData
  };

  if (isMock) {
    const orders = JSON.parse(localStorage.getItem("jv_orders") || "[]");
    orders.push(finalOrder);
    localStorage.setItem("jv_orders", JSON.stringify(orders));

    // Abate do estoque
    const products = JSON.parse(localStorage.getItem("jv_products") || "[]");
    for (const item of finalOrder.items) {
      const p = products.find(prod => prod.id === item.id);
      if (p) {
        p.stock = Math.max(0, p.stock - item.quantity);
      }
    }
    localStorage.setItem("jv_products", JSON.stringify(products));

    return finalOrder;
  } else {
    try {
      // Salva no Firestore
      await setDoc(doc(db, "orders", finalOrder.orderId), finalOrder);
      
      // Abate do estoque no Firestore
      for (const item of finalOrder.items) {
        const docRef = doc(db, "products", item.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentStock = docSnap.data().stock || 0;
          await updateDoc(docRef, { stock: Math.max(0, currentStock - item.quantity) });
        }
      }
      return finalOrder;
    } catch (e) {
      console.error("Erro ao registrar pedido no Firestore:", e);
      throw e;
    }
  }
}

// Retorna todos os pedidos (Visão Administrativa)
export async function getOrders() {
  if (isMock) {
    return JSON.parse(localStorage.getItem("jv_orders") || "[]");
  } else {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    // Ordena por data decrescente
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }
}

// Executa semente inicial
seedDatabase();
