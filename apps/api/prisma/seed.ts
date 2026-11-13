import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin User (owner) ──
  const admin = await prisma.adminUser.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      name: 'Sajani Admin',
      role: 'owner',
    },
  });
  console.log(`  ✓ Admin user: ${admin.name} (${admin.role})`);

  // ── Categories ──
  const categories = [
    { slug: 'everyday', name: 'Everyday', description: 'Tussar & Cotton weaves for daily elegance', sortOrder: 0 },
    { slug: 'signature', name: 'Signature', description: 'Pure Ikat silks — our finest handloom masterpieces', sortOrder: 1 },
    { slug: 'heritage', name: 'Heritage', description: 'Bomkai & Pasapalli traditions preserved in silk', sortOrder: 2 },
    { slug: 'celebrations', name: 'Celebrations', description: 'Bridal Zari Pallu sarees for special occasions', sortOrder: 3 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✓ ${categories.length} categories`);

  // ── Products ──
  const allCategories = await prisma.category.findMany();
  const catMap = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]));

  const products = [
    {
      title: 'Sambalpuri Ikat Silk Saree – Maroon & Gold',
      slug: 'sambalpuri-ikat-silk-saree-maroon-gold',
      shortDescription: 'Handwoven Sambalpuri Ikat silk saree featuring traditional Bapta design with gold zari border',
      description: 'Each thread of this exquisite saree is precision tie-dyed before weaving on a traditional pit loom by master weavers of the Bargarh cluster. The Bapta design features temple spire motifs on a rich maroon ground with a contrasting gold zari border and ornate pallu.',
      categorySlug: 'signature',
      fabric: 'Pure Mulberry Silk',
      weaveMethod: 'Handloom Ikat',
      origin: 'Bargarh, Odisha',
      careInstructions: 'Dry clean only. Store in muslin cloth away from direct sunlight.',
      blousePiece: 'Included – 0.8m unstitched',
      length: '5.5 meters',
      width: '46 inches',
      weight: '450 grams',
      occasion: ['Festive', 'Wedding', 'Party'],
      tags: ['silk', 'ikat', 'bapta', 'maroon', 'gold', 'handloom'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-IKT-MRN-001', name: 'Deep Maroon & Gold', color: 'Maroon', pricePaise: 350000, compareAtPaise: 450000, stock: 5 },
        { sku: 'SAJ-IKT-NVY-001', name: 'Navy Blue & Silver', color: 'Navy', pricePaise: 385000, compareAtPaise: 450000, stock: 3 },
      ],
    },
    {
      title: 'Bomkai Handwoven Silk Saree – Forest Green',
      slug: 'bomkai-handwoven-silk-saree-forest-green',
      shortDescription: 'Traditional Bomkai silk with intricate thread work and ethnic motifs',
      description: 'A masterpiece of Bomkai weaving tradition from Sonepur, this saree features detailed supplementary weft work with traditional fish and flower motifs. The forest green body contrasts beautifully with a terracotta and ivory pallu.',
      categorySlug: 'heritage',
      fabric: 'Pure Mulberry Silk',
      weaveMethod: 'Bomkai',
      origin: 'Sonepur, Subarnapur District, Odisha',
      careInstructions: 'Dry clean recommended. Store flat or loosely rolled.',
      blousePiece: 'Included – 0.8m unstitched',
      length: '5.5 meters',
      width: '46 inches',
      weight: '500 grams',
      occasion: ['Festive', 'Traditional'],
      tags: ['silk', 'bomkai', 'green', 'handloom', 'heritage'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-BMK-GRN-001', name: 'Forest Green & Terracotta', color: 'Green', pricePaise: 420000, compareAtPaise: 500000, stock: 4 },
      ],
    },
    {
      title: 'Pasapalli Cotton Saree – Ivory & Indigo',
      slug: 'pasapalli-cotton-saree-ivory-indigo',
      shortDescription: 'Classic Pasapalli check pattern in lightweight cotton for everyday elegance',
      description: 'The iconic Pasapalli chessboard pattern rendered in soft handloom cotton. Perfect for daily wear in warm Odisha weather. The indigo and ivory combination is timelessly sophisticated.',
      categorySlug: 'everyday',
      fabric: 'Handloom Cotton',
      weaveMethod: 'Pasapalli',
      origin: 'Bargarh, Odisha',
      careInstructions: 'Hand wash in cold water. Dry in shade.',
      blousePiece: 'Included – 0.8m unstitched',
      length: '6.3 meters with blouse',
      width: '44 inches',
      weight: '350 grams',
      occasion: ['Daily Wear', 'Office', 'Casual'],
      tags: ['cotton', 'pasapalli', 'ivory', 'indigo', 'daily'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-PSP-IVR-001', name: 'Ivory & Indigo', color: 'Ivory', pricePaise: 180000, compareAtPaise: null, stock: 6 },
        { sku: 'SAJ-PSP-RED-001', name: 'Ivory & Red', color: 'Red', pricePaise: 180000, compareAtPaise: null, stock: 5 },
      ],
    },
    {
      title: 'Tussar Silk Saree – Natural Gold',
      slug: 'tussar-silk-saree-natural-gold',
      shortDescription: 'Wild tussar silk with natural golden sheen and minimal handloom design',
      description: 'Raw wild tussar silk with its characteristic natural golden texture. Minimally designed to let the fabric speak, with a subtle thread border. A connoisseur\'s everyday luxury.',
      categorySlug: 'everyday',
      fabric: 'Tussar Silk',
      weaveMethod: 'Handloom',
      origin: 'Sonepur, Odisha',
      careInstructions: 'Dry clean only.',
      blousePiece: 'Included – 0.8m unstitched',
      length: '5.5 meters',
      width: '46 inches',
      weight: '380 grams',
      occasion: ['Daily Wear', 'Office', 'Festive'],
      tags: ['tussar', 'silk', 'gold', 'natural', 'minimal'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-TSR-GLD-001', name: 'Natural Gold', color: 'Gold', pricePaise: 280000, compareAtPaise: 320000, stock: 4 },
      ],
    },
    {
      title: 'Bridal Zari Pallu Silk Saree – Royal Maroon',
      slug: 'bridal-zari-pallu-silk-saree-royal-maroon',
      shortDescription: 'Opulent bridal saree with heavy zari work pallu and temple border',
      description: 'A statement bridal piece featuring heavy gold zari work across the pallu with intricate temple spire borders. Woven over 21 days by master artisans, this is a once-in-a-lifetime heirloom.',
      categorySlug: 'celebrations',
      fabric: 'Pure Silk with Zari',
      weaveMethod: 'Handloom Ikat',
      origin: 'Bargarh, Odisha',
      careInstructions: 'Dry clean only. Professional storage recommended.',
      blousePiece: 'Included – 1m unstitched with zari',
      length: '5.5 meters',
      width: '47 inches',
      weight: '650 grams',
      occasion: ['Wedding', 'Bridal', 'Special Occasion'],
      tags: ['bridal', 'zari', 'silk', 'maroon', 'wedding', 'premium'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-BRD-MRN-001', name: 'Royal Maroon & Gold', color: 'Maroon', pricePaise: 850000, compareAtPaise: null, stock: 2 },
        { sku: 'SAJ-BRD-RED-001', name: 'Bridal Red & Gold', color: 'Red', pricePaise: 920000, compareAtPaise: null, stock: 2 },
      ],
    },
    {
      title: 'Sambalpuri Cotton Saree – Mustard Sonepuri',
      slug: 'sambalpuri-cotton-saree-mustard-sonepuri',
      shortDescription: 'Lightweight Sonepuri cotton with traditional ikat patterns in warm mustard',
      description: 'A breezy Sonepuri cotton saree perfect for Odisha\'s warm climate. Traditional ikat motifs in warm mustard and terracotta on a cream base. Effortless daily elegance.',
      categorySlug: 'everyday',
      fabric: 'Cotton',
      weaveMethod: 'Handloom Ikat',
      origin: 'Sonepur, Odisha',
      careInstructions: 'Hand wash or gentle machine wash. Line dry.',
      blousePiece: 'Included – 0.8m unstitched',
      length: '6.3 meters with blouse',
      width: '44 inches',
      weight: '300 grams',
      occasion: ['Daily Wear', 'Casual'],
      tags: ['cotton', 'ikat', 'mustard', 'sonepuri', 'daily'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-SON-MST-001', name: 'Mustard & Terracotta', color: 'Mustard', pricePaise: 150000, compareAtPaise: 180000, stock: 6 },
      ],
    },
    {
      title: 'Heritage Kumbha Silk – Deep Sapphire',
      slug: 'heritage-kumbha-silk-deep-sapphire',
      shortDescription: 'Rare Kumbha weave silk with temple architecture motifs in deep sapphire blue',
      description: 'The Kumbha weave is one of the rarest Sambalpuri techniques, featuring temple pot motifs that symbolize prosperity. This deep sapphire blue masterpiece takes over 14 days on the loom.',
      categorySlug: 'heritage',
      fabric: 'Pure Silk',
      weaveMethod: 'Handloom Kumbha',
      origin: 'Bargarh, Odisha',
      careInstructions: 'Dry clean only. Store in muslin cloth.',
      blousePiece: 'Included – 0.8m unstitched',
      length: '5.5 meters',
      width: '46 inches',
      weight: '480 grams',
      occasion: ['Festive', 'Traditional', 'Collector'],
      tags: ['silk', 'kumbha', 'sapphire', 'heritage', 'rare'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-KMB-SPH-001', name: 'Deep Sapphire & Paisley', color: 'Blue', pricePaise: 520000, compareAtPaise: null, stock: 3 },
      ],
    },
    {
      title: 'Silk-Cotton Blend Saree – Olive Flora',
      slug: 'silk-cotton-blend-saree-olive-flora',
      shortDescription: 'Comfortable silk-cotton blend with floral motifs for semi-formal occasions',
      description: 'The perfect balance of silk\'s sheen and cotton\'s comfort. Delicate floral motifs in olive green with gold accents. Ideal for office, temple visits, or casual celebrations.',
      categorySlug: 'everyday',
      fabric: 'Silk-Cotton Blend',
      weaveMethod: 'Handloom',
      origin: 'Sonepur, Odisha',
      careInstructions: 'Dry clean recommended. Gentle hand wash possible.',
      blousePiece: 'Included – 0.8m unstitched',
      length: '5.5 meters',
      width: '44 inches',
      weight: '400 grams',
      occasion: ['Office', 'Semi-Formal', 'Temple'],
      tags: ['blend', 'silk-cotton', 'olive', 'flora', 'office'],
      publishStatus: 'published',
      variants: [
        { sku: 'SAJ-BLD-OLV-001', name: 'Olive Flora & Gold', color: 'Olive', pricePaise: 220000, compareAtPaise: 280000, stock: 5 },
      ],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ⏭ Product already exists: ${p.title}`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        shortDescription: p.shortDescription,
        categoryId: catMap[p.categorySlug],
        publishStatus: p.publishStatus,
        fabric: p.fabric,
        weaveMethod: p.weaveMethod,
        origin: p.origin,
        careInstructions: p.careInstructions,
        blousePiece: p.blousePiece,
        length: p.length,
        width: p.width,
        weight: p.weight,
        occasion: p.occasion,
        tags: p.tags,
      },
    });

    for (const [i, v] of p.variants.entries()) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: v.sku,
          name: v.name,
          color: v.color,
          pricePaise: v.pricePaise,
          compareAtPaise: v.compareAtPaise,
          sortOrder: i,
        },
      });

      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          onHand: v.stock,
        },
      });
    }

    console.log(`  ✓ ${p.title} (${p.variants.length} variants)`);
  }

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
