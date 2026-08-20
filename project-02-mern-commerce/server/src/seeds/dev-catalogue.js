/**
 * Development catalogue fixtures.
 *
 * Gives the local database enough categories and products to build and check
 * the storefront against real API data. Run it by hand:
 *
 *   npm run seed:dev-catalogue
 *
 * This is NOT the deliverable seed script. Day 15 implements the full
 * deterministic seed from Section 14 of CLAUDE.md (admin user, demo user,
 * categories, products and demo orders). This file only covers the catalogue,
 * touches no user or order data, and is safe to re-run: it clears the two
 * catalogue collections first, so it never creates duplicate-key failures.
 *
 * All product data is fictional. Nothing here makes a medical or efficacy
 * claim - the items are ordinary laboratory glassware and consumables.
 */
import mongoose from "mongoose";
import { assertConfig, config, isProduction } from "../config/env.js";
import { connectDatabase, disconnectDatabase, describeConnection } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

const CATEGORIES = [
  {
    name: "Laboratorijsko posuđe",
    description: "Staklo i plastika za svakodnevni rad u laboratoriji.",
  },
  {
    name: "Mjerni instrumenti",
    description: "Instrumenti za mjerenje mase, temperature i zapremine.",
  },
  {
    name: "Potrošni materijal",
    description: "Materijal koji se troši tokom rada i redovno se dopunjuje.",
  },
];

/** `category` is the index into CATEGORIES above. */
const PRODUCTS = [
  {
    name: "Staklena čaša 250 ml",
    sku: "LAB-BKR-250",
    category: 0,
    price: 12.9,
    compareAtPrice: 15.5,
    stock: 48,
    featured: true,
    tags: ["staklo", "čaša"],
    shortDescription: "Niska čaša od borosilikatnog stakla sa skalom.",
    description:
      "Niska laboratorijska čaša od borosilikatnog stakla, zapremine 250 ml, " +
      "sa štampanom skalom i izljevom. Pogodna za zagrijavanje i miješanje.",
  },
  {
    name: "Erlenmajer tikvica 500 ml",
    sku: "LAB-ERL-500",
    category: 0,
    price: 18.4,
    stock: 30,
    featured: true,
    tags: ["staklo", "tikvica"],
    shortDescription: "Konusna tikvica sa uskim grlom, 500 ml.",
    description:
      "Konusna tikvica od borosilikatnog stakla zapremine 500 ml. Uski vrat " +
      "smanjuje isparavanje i olakšava miješanje kružnim pokretima.",
  },
  {
    name: "Menzura 100 ml",
    sku: "LAB-MNZ-100",
    category: 0,
    price: 9.6,
    stock: 62,
    tags: ["staklo", "mjerenje"],
    shortDescription: "Graduirana menzura sa stabilnom bazom.",
    description:
      "Graduirana menzura od 100 ml sa heksagonalnom bazom koja sprječava " +
      "prevrtanje. Podjela na 1 ml.",
  },
  {
    name: "Stakleni lijevak 75 mm",
    sku: "LAB-LJV-075",
    category: 0,
    price: 7.2,
    stock: 40,
    tags: ["staklo", "filtriranje"],
    shortDescription: "Lijevak za filtriranje, prečnik 75 mm.",
    description:
      "Klasični stakleni lijevak prečnika 75 mm sa uglom od 60 stepeni, " +
      "namijenjen filtriranju uz filter papir.",
  },
  {
    name: "Petrijeva posuda 90 mm",
    sku: "LAB-PET-090",
    category: 0,
    price: 4.5,
    stock: 120,
    tags: ["plastika", "posuda"],
    shortDescription: "Plastična posuda sa poklopcem, pakovanje 10 komada.",
    description:
      "Petrijeve posude prečnika 90 mm sa poklopcem, isporučene u pakovanju " +
      "od deset komada. Ravno dno i glatke ivice.",
  },
  {
    name: "Digitalna vaga 0.01 g",
    sku: "INS-VGA-001",
    category: 1,
    price: 189.0,
    compareAtPrice: 219.0,
    stock: 8,
    featured: true,
    tags: ["vaga", "mjerenje"],
    shortDescription: "Precizna vaga do 500 g sa tara funkcijom.",
    description:
      "Digitalna precizna vaga nosivosti 500 g i podjelom od 0.01 g. Ima " +
      "tara funkciju, LCD ekran i vjetrobransku zaštitu.",
  },
  {
    name: "Laboratorijski termometar -10/110 °C",
    sku: "INS-TRM-110",
    category: 1,
    price: 14.9,
    stock: 25,
    tags: ["temperatura"],
    shortDescription: "Stakleni termometar sa crvenim punjenjem.",
    description:
      "Stakleni laboratorijski termometar opsega od -10 do 110 stepeni " +
      "Celzijusa, sa podjelom od jednog stepena.",
  },
  {
    name: "Automatska pipeta 100-1000 µl",
    sku: "INS-PIP-1000",
    category: 1,
    price: 96.5,
    stock: 12,
    tags: ["pipeta", "mjerenje"],
    shortDescription: "Podesiva pipeta sa izbacivačem nastavaka.",
    description:
      "Jednokanalna automatska pipeta opsega 100-1000 mikrolitara, sa " +
      "podesivim volumenom i dugmetom za izbacivanje nastavka.",
  },
  {
    name: "pH metar sa elektrodom",
    sku: "INS-PHM-200",
    category: 1,
    price: 142.0,
    stock: 6,
    tags: ["ph", "mjerenje"],
    shortDescription: "Digitalni pH metar sa kalibracionim rastvorima.",
    description:
      "Digitalni pH metar sa staklenom elektrodom, automatskom temperaturnom " +
      "kompenzacijom i priborom za kalibraciju.",
  },
  {
    name: "Magnetna mješalica sa grijanjem",
    sku: "INS-MGM-300",
    category: 1,
    price: 268.0,
    stock: 4,
    tags: ["mješalica"],
    shortDescription: "Ploča sa podesivim brojem obrtaja i grijanjem.",
    description:
      "Magnetna mješalica sa grijanom pločom, podesivim brojem obrtaja do " +
      "1500 o/min i odvojenom regulacijom temperature.",
  },
  {
    name: "Nitrilne rukavice, veličina M",
    sku: "POT-RUK-M",
    category: 2,
    price: 11.9,
    stock: 200,
    tags: ["zaštita", "rukavice"],
    shortDescription: "Kutija od 100 komada, bez pudera.",
    description:
      "Jednokratne nitrilne rukavice bez pudera, veličina M, pakovanje od " +
      "100 komada. Teksturirani vrhovi prstiju.",
  },
  {
    name: "Filter papir 110 mm",
    sku: "POT-FLT-110",
    category: 2,
    price: 6.8,
    stock: 150,
    tags: ["filtriranje", "papir"],
    shortDescription: "Kvalitativni filter papir, 100 listova.",
    description:
      "Kružni kvalitativni filter papir prečnika 110 mm, srednje brzine " +
      "filtracije, pakovanje od 100 listova.",
  },
  {
    name: "Nastavci za pipetu 1000 µl",
    sku: "POT-NAS-1000",
    category: 2,
    price: 8.4,
    stock: 300,
    tags: ["pipeta", "plastika"],
    shortDescription: "Univerzalni nastavci, pakovanje 500 komada.",
    description:
      "Univerzalni plastični nastavci za automatske pipete do 1000 " +
      "mikrolitara, pakovanje od 500 komada.",
  },
  {
    name: "Laboratorijska bočica 100 ml",
    sku: "POT-BOC-100",
    category: 2,
    price: 5.9,
    stock: 90,
    tags: ["čuvanje", "staklo"],
    shortDescription: "Bočica sa navojnim zatvaračem i skalom.",
    description:
      "Staklena bočica sa plavim navojnim zatvaračem, zapremine 100 ml, sa " +
      "skalom i prstenom za izlivanje.",
  },
  {
    name: "Stalak za epruvete, 12 mjesta",
    sku: "POT-STL-012",
    category: 2,
    price: 13.5,
    stock: 0,
    // Deliberately points at a file that does not exist, so the storefront's
    // "image missing" fallback stays exercised during development.
    imageUrl: "/images/products/nema-slike.png",
    tags: ["stalak"],
    shortDescription: "Plastični stalak za epruvete prečnika do 20 mm.",
    description:
      "Stalak sa dvanaest mjesta za epruvete prečnika do 20 mm, izrađen od " +
      "hemijski otporne plastike.",
  },
  {
    name: "Stara serija menzura 50 ml",
    sku: "POT-MNZ-050",
    category: 2,
    price: 6.2,
    stock: 5,
    active: false,
    tags: ["staklo"],
    shortDescription: "Povučeno iz ponude - koristi se za provjeru filtera.",
    description:
      "Artikal koji više nije u prodaji. Zadržan je u bazi da se u razvoju " +
      "vidi da neaktivni proizvodi ne izlaze na javnom katalogu.",
  },
];

async function main() {
  assertConfig();

  if (isProduction) {
    throw new Error("Refusing to load development fixtures while NODE_ENV=production.");
  }

  await connectDatabase(config.mongodbUri);
  console.log(`Connected to ${describeConnection(config.mongodbUri)}`);

  await Product.deleteMany({});
  await Category.deleteMany({});

  const categories = await Category.create(CATEGORIES);
  console.log(`Inserted ${categories.length} categories.`);

  const products = await Product.create(
    PRODUCTS.map((product) => ({
      ...product,
      category: categories[product.category]._id,
      imageUrl:
        product.imageUrl ??
        "/images/product-placeholder.svg",
    })),
  );

  const active = products.filter((product) => product.active).length;
  console.log(
    `Inserted ${products.length} products (${active} active, ` +
      `${products.length - active} inactive, ` +
      `${products.filter((p) => p.featured).length} featured, ` +
      `${products.filter((p) => p.stock === 0).length} out of stock).`,
  );

  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error(`Development catalogue seed failed: ${error.message}`);
  if (mongoose.connection.readyState !== 0) await disconnectDatabase();
  process.exit(1);
});
