import random
from datetime import datetime, timedelta
from pathlib import Path

from app.core.security import hash_password
from app.db.session import Base, engine, SessionLocal
from app.models.models import (
    Category, Product, Customer, Order, OrderItem, Review, Deal, Banner,
    SupportTicket, TicketMessage, Payment, OrderStatus, TicketStatus, CartItem, WishlistItem,
    UserRole, Domain, Language, Crop, CropIssue, IssueType, IssueStatus, Advisory, Scheme,
    KnowledgeBase, KnowledgeDocument, KnowledgeChunk,
)
from app.product_images import BANNER_IMAGE_URLS, product_image_url
from app.knowledge_seed import KNOWLEDGE_ARTICLES, SEEDED_GUIDES
from app.services.pdf_ingestion import extract_pdf_chunks

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()
now = datetime.utcnow()
DEMO_PASSWORD = "password123"

# ============================================================
# E-COMMERCE DOMAIN
# ============================================================

CATEGORIES = [
    ("Laptops", "laptop"),
    ("Mobiles", "smartphone"),
    ("Tablets", "tablet"),
    ("Headphones", "headphones"),
    ("Smartwatches", "watch"),
    ("Cameras", "camera"),
    ("Accessories", "cable"),
]

category_objs = {}
for name, icon in CATEGORIES:
    c = Category(name=name, icon=icon, domain=Domain.ecommerce)
    db.add(c)
    db.flush()
    category_objs[name] = c

PRODUCTS = [
    # Laptops
    ("ASUS Vivobook 15 (i5, 16GB, 512GB)", "ASUS", "Laptops", 52990, 59990, 45, 4.2, 1200, True),
    ("Dell XPS 13 (i7, 16GB, 1TB)", "Dell", "Laptops", 89999, 99999, 15, 4.5, 540, False),
    ("MacBook Air M2 (8GB, 256GB)", "Apple", "Laptops", 99900, 109900, 22, 4.7, 2300, True),
    ("Lenovo IdeaPad Slim 5", "Lenovo", "Laptops", 48990, 54990, 30, 4.0, 680, False),
    ("HP Pavilion 14 (Ryzen 5)", "HP", "Laptops", 44990, 49990, 27, 3.9, 410, False),
    ("Acer Predator Helios Neo 16", "Acer", "Laptops", 124990, 139990, 9, 4.4, 220, False),
    # Mobiles
    ("Apple iPhone 15 (128GB)", "Apple", "Mobiles", 57999, 64999, 38, 4.3, 3400, True),
    ("Samsung Galaxy S24 (256GB)", "Samsung", "Mobiles", 69999, 79999, 25, 4.4, 2100, True),
    ("OnePlus Nord CE 4", "OnePlus", "Mobiles", 24999, 27999, 60, 4.1, 1800, False),
    ("Xiaomi Redmi Note 13 Pro", "Xiaomi", "Mobiles", 21999, 25999, 85, 4.0, 2900, False),
    ("Google Pixel 8a", "Google", "Mobiles", 52999, 58999, 19, 4.5, 740, False),
    ("Vivo V30", "Vivo", "Mobiles", 33999, 37999, 42, 4.1, 560, False),
    # Tablets
    ("iPad 10th Gen", "Apple", "Tablets", 28999, 35999, 18, 4.5, 950, False),
    ("Samsung Galaxy Tab S9", "Samsung", "Tablets", 65999, 72999, 11, 4.4, 310, False),
    ("Lenovo Tab P11", "Lenovo", "Tablets", 16990, 19990, 6, 3.8, 190, False),
    # Headphones
    ("boAt Rockerz 450 Headphones", "boAt", "Headphones", 1999, 2999, 120, 4.1, 8300, True),
    ("Sony WH-CH520 Headphones", "Sony", "Headphones", 2999, 4999, 5, 4.2, 1500, False),
    ("JBL Tune 760NC", "JBL", "Headphones", 3499, 4999, 32, 4.0, 2400, False),
    ("Apple AirPods Pro (2nd Gen)", "Apple", "Headphones", 22990, 26900, 24, 4.6, 4100, True),
    ("Sennheiser HD 450BT", "Sennheiser", "Headphones", 8999, 11999, 14, 4.3, 390, False),
    # Smartwatches
    ("Noise Smartwatch (Gen 2)", "Noise", "Smartwatches", 2499, 3999, 6, 4.0, 2100, True),
    ("Apple Watch SE", "Apple", "Smartwatches", 29999, 32999, 20, 4.4, 1100, False),
    ("Samsung Galaxy Watch 6", "Samsung", "Smartwatches", 27999, 31999, 13, 4.3, 620, False),
    ("boAt Wave Call", "boAt", "Smartwatches", 1499, 2499, 95, 3.9, 3300, False),
    # Cameras
    ("Canon EOS 1500D", "Canon", "Cameras", 37999, 49999, 8, 4.3, 620, False),
    ("GoPro Hero 11", "GoPro", "Cameras", 39999, 44999, 10, 4.3, 430, False),
    ("Sony Alpha a6400", "Sony", "Cameras", 84990, 94990, 5, 4.6, 280, False),
    ("Nikon D3500", "Nikon", "Cameras", 33990, 39990, 7, 4.2, 310, False),
    # Accessories
    ("Logitech MX Master 3 Mouse", "Logitech", "Accessories", 7999, 9999, 4, 4.6, 780, False),
    ("Anker 20W Fast Charger", "Anker", "Accessories", 1499, 1999, 200, 4.5, 3200, False),
    ("Samsung 1TB Portable SSD", "Samsung", "Accessories", 8499, 9999, 55, 4.7, 1200, False),
    ("Logitech K380 Keyboard", "Logitech", "Accessories", 2999, 3499, 48, 4.4, 890, False),
    ("boAt Type-C Cable (2m)", "boAt", "Accessories", 399, 599, 300, 4.0, 5100, False),
]

product_objs = []
category_image_indexes: dict[str, int] = {}
for idx, (name, brand, cat, price, orig, stock, rating, rating_count, featured) in enumerate(PRODUCTS):
    image_index = category_image_indexes.get(cat, 0)
    p = Product(
        name=name, brand=brand,
        description=f"{name} — reliable performance, great value, backed by brand warranty.",
        price=price, original_price=orig, stock=stock,
        image_url=product_image_url(cat, image_index),
        warranty="1 Year Manufacturer Warranty",
        rating=rating, rating_count=rating_count, is_featured=featured,
        category_id=category_objs[cat].id,
        created_at=now - timedelta(days=random.randint(0, 20)),
    )
    db.add(p)
    product_objs.append(p)
    category_image_indexes[cat] = image_index + 1
db.flush()

# ============================================================
# AGRICULTURE DOMAIN
# ============================================================

AGRI_CATEGORIES = [
    ("Seeds", "sprout"),
    ("Fertilizers", "flask"),
    ("Farming Tools", "shovel"),
    ("Irrigation", "droplets"),
    ("Pesticides", "spray"),
]

agri_category_objs = {}
for name, icon in AGRI_CATEGORIES:
    c = Category(name=name, icon=icon, domain=Domain.agriculture)
    db.add(c)
    db.flush()
    agri_category_objs[name] = c

AGRI_PRODUCTS = [
    # Seeds
    ("Tomato Seeds (Syngenta)", "Syngenta", "Seeds", 650, 750, 180, 4.3, 420, True),
    ("Hybrid Maize Seeds", "Mahyco", "Seeds", 480, 550, 220, 4.1, 310, False),
    ("Cotton Seeds (Bt Cotton)", "Rasi Seeds", "Seeds", 820, 900, 95, 4.4, 260, False),
    ("Chilli Seeds (Hybrid)", "Nuziveedu", "Seeds", 390, 450, 150, 4.0, 180, False),
    ("Paddy Seeds (BPT 5204)", "Kaveri Seeds", "Seeds", 55, 65, 400, 4.2, 530, True),
    # Fertilizers
    ("NPK Fertilizer (19:19:19)", "IFFCO", "Fertilizers", 850, 950, 300, 4.5, 890, True),
    ("Urea Fertilizer (45kg)", "IFFCO", "Fertilizers", 266, 300, 500, 4.3, 1100, False),
    ("DAP Fertilizer (50kg)", "Coromandel", "Fertilizers", 1350, 1500, 240, 4.4, 620, False),
    ("Neem Oil (Organic, 1L)", "Nimboli", "Fertilizers", 350, 420, 310, 4.6, 780, True),
    ("Vermicompost (10kg)", "EcoGrow", "Fertilizers", 280, 320, 260, 4.5, 410, False),
    # Farming Tools
    ("Hand Cultivator", "Falcon", "Farming Tools", 450, 550, 140, 4.2, 220, True),
    ("Sprayer Pump (16L)", "Neptune", "Farming Tools", 1850, 2200, 85, 4.3, 190, False),
    ("Sickle (Traditional)", "Falcon", "Farming Tools", 180, 220, 300, 4.1, 150, False),
    ("Power Weeder", "Honda", "Farming Tools", 28500, 32000, 12, 4.6, 65, False),
    ("Garden Spade", "Falcon", "Farming Tools", 320, 380, 200, 4.0, 110, False),
    # Irrigation
    ("Drip Irrigation Pipe (100m)", "Jain Irrigation", "Irrigation", 1200, 1450, 90, 4.4, 240, True),
    ("Sprinkler Set (6-piece)", "Jain Irrigation", "Irrigation", 950, 1100, 75, 4.2, 160, False),
    ("Water Pump (1HP)", "Kirloskar", "Irrigation", 6500, 7200, 30, 4.5, 190, False),
    # Pesticides
    ("Bio Pesticide (Neem Based)", "Nimboli", "Pesticides", 420, 480, 170, 4.3, 290, False),
    ("Fungicide Spray (500ml)", "Bayer", "Pesticides", 680, 760, 110, 4.2, 150, False),
]

agri_product_objs = []
category_image_indexes = {}
for idx, (name, brand, cat, price, orig, stock, rating, rating_count, featured) in enumerate(AGRI_PRODUCTS):
    image_index = category_image_indexes.get(cat, 0)
    p = Product(
        name=name, brand=brand,
        description=f"{name} — trusted by farmers for consistent results and quality.",
        price=price, original_price=orig, stock=stock,
        image_url=product_image_url(cat, image_index),
        warranty="Manufacturer Warranty",
        rating=rating, rating_count=rating_count, is_featured=featured,
        category_id=agri_category_objs[cat].id,
        created_at=now - timedelta(days=random.randint(0, 20)),
    )
    db.add(p)
    agri_product_objs.append(p)
    category_image_indexes[cat] = image_index + 1
db.flush()

all_product_objs = product_objs + agri_product_objs

# ============================================================
# CUSTOMERS (E-Commerce) + FARMERS (Agriculture)
# ============================================================

CUSTOMER_NAMES = [
    ("Anvitha Reddy", "anvitha@example.com", "Hyderabad"),
    ("Rahul Sharma", "rahul@example.com", "Delhi"),
    ("Priya Nair", "priya@example.com", "Bengaluru"),
    ("Karthik Iyer", "karthik@example.com", "Chennai"),
    ("Sneha Patel", "sneha@example.com", "Ahmedabad"),
    ("Vikram Singh", "vikram@example.com", "Pune"),
    ("Meera Krishnan", "meera@example.com", "Kochi"),
    ("Arjun Mehta", "arjun@example.com", "Mumbai"),
    ("Divya Rao", "divya@example.com", "Visakhapatnam"),
    ("Siddharth Bose", "siddharth@example.com", "Kolkata"),
    ("Pooja Desai", "pooja@example.com", "Surat"),
    ("Rohan Kapoor", "rohan@example.com", "Jaipur"),
    ("Ishita Verma", "ishita@example.com", "Lucknow"),
    ("Aditya Nambiar", "aditya@example.com", "Coimbatore"),
    ("Kavya Menon", "kavya@example.com", "Thiruvananthapuram"),
    ("Yash Agarwal", "yash@example.com", "Indore"),
]

customer_objs = []
for name, email, city in CUSTOMER_NAMES:
    c = Customer(
        name=name, email=email, phone="9999999999", city=city,
        password_hash=hash_password(DEMO_PASSWORD), role=UserRole.customer,
        created_at=now - timedelta(days=random.randint(0, 25)),
    )
    db.add(c)
    customer_objs.append(c)

FARMER_NAMES = [
    ("Ramayya Naidu", "ramayya@example.com", "Guntur"),
    ("Lakshmi Devi", "lakshmi@example.com", "Warangal"),
    ("Venkata Rao", "venkata@example.com", "Nellore"),
    ("Suresh Patil", "suresh@example.com", "Nashik"),
    ("Kamala Bai", "kamala@example.com", "Kolhapur"),
    ("Gurpreet Singh", "gurpreet@example.com", "Ludhiana"),
    ("Manjunath Gowda", "manjunath@example.com", "Mysuru"),
    ("Rukmini Amma", "rukmini@example.com", "Thanjavur"),
    ("Baldev Yadav", "baldev@example.com", "Meerut"),
    ("Chandramma", "chandramma@example.com", "Karimnagar"),
]

farmer_objs = []
for name, email, city in FARMER_NAMES:
    f = Customer(
        name=name, email=email, phone="8888888888", city=city,
        password_hash=hash_password(DEMO_PASSWORD), role=UserRole.farmer,
        created_at=now - timedelta(days=random.randint(0, 40)),
    )
    db.add(f)
    farmer_objs.append(f)

db.flush()

# A demo admin login
admin_user = Customer(
    name="Admin", email="admin@techkart.com", phone="7777777777", city="Hyderabad",
    password_hash=hash_password(DEMO_PASSWORD), role=UserRole.admin,
    created_at=now - timedelta(days=60),
)
db.add(admin_user)
db.flush()

all_customer_objs = customer_objs + farmer_objs

# ============================================================
# ORDERS (both domains) + PAYMENTS
# ============================================================

STATUSES = [OrderStatus.delivered, OrderStatus.processing, OrderStatus.shipped, OrderStatus.cancelled]
WEIGHTS = [0.7, 0.15, 0.1, 0.05]

for i in range(90):
    customer = random.choice(customer_objs)
    chosen_products = random.sample(product_objs, k=random.randint(1, 3))
    total = sum(p.price for p in chosen_products)
    status = random.choices(STATUSES, weights=WEIGHTS, k=1)[0]
    order = Order(
        customer_id=customer.id, status=status, total_amount=total,
        shipping_address=f"{customer.name}, {customer.city}",
        payment_method=random.choice(["card", "upi", "cod"]),
        created_at=now - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23)),
    )
    db.add(order)
    db.flush()
    for p in chosen_products:
        db.add(OrderItem(order_id=order.id, product_id=p.id, quantity=1, unit_price=p.price))
    db.add(Payment(order_id=order.id, amount=total, method=order.payment_method, status="success", created_at=order.created_at))

for i in range(40):
    farmer = random.choice(farmer_objs)
    chosen_products = random.sample(agri_product_objs, k=random.randint(1, 3))
    total = sum(p.price for p in chosen_products)
    status = random.choices(STATUSES, weights=WEIGHTS, k=1)[0]
    order = Order(
        customer_id=farmer.id, status=status, total_amount=total,
        shipping_address=f"{farmer.name}, {farmer.city}",
        payment_method=random.choice(["card", "upi", "cod"]),
        created_at=now - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23)),
    )
    db.add(order)
    db.flush()
    for p in chosen_products:
        db.add(OrderItem(order_id=order.id, product_id=p.id, quantity=random.randint(1, 3), unit_price=p.price))
    db.add(Payment(order_id=order.id, amount=total, method=order.payment_method, status="success", created_at=order.created_at))

# ============================================================
# REVIEWS
# ============================================================

REVIEW_COMMENTS = [
    "Great product, works as expected.",
    "Exceeded my expectations, would buy again.",
    "Good value for the price.",
    "Packaging was solid, delivery was fast.",
    "Does the job but battery life could be better.",
    "Exactly as described, very happy with this purchase.",
    "Build quality feels premium.",
    "Had a minor issue but support resolved it quickly.",
]
for p in random.sample(product_objs, k=22):
    for _ in range(random.randint(1, 2)):
        customer = random.choice(customer_objs)
        db.add(Review(
            product_id=p.id, customer_id=customer.id, rating=random.randint(3, 5),
            comment=random.choice(REVIEW_COMMENTS), is_approved=random.random() > 0.15,
            created_at=now - timedelta(days=random.randint(0, 10)),
        ))

AGRI_REVIEW_COMMENTS = [
    "Good quality, crop yield improved this season.",
    "Worked well, will order again next season.",
    "Reasonably priced and effective.",
    "Delivery took a bit long but product is genuine.",
    "Recommended by our local agri expert, works great.",
]
for p in random.sample(agri_product_objs, k=14):
    for _ in range(random.randint(1, 2)):
        farmer = random.choice(farmer_objs)
        db.add(Review(
            product_id=p.id, customer_id=farmer.id, rating=random.randint(3, 5),
            comment=random.choice(AGRI_REVIEW_COMMENTS), is_approved=random.random() > 0.1,
            created_at=now - timedelta(days=random.randint(0, 10)),
        ))

# ============================================================
# DEALS (both domains)
# ============================================================

DEAL_PRODUCTS = [p for p in all_product_objs if p.original_price and p.original_price > p.price]
random.shuffle(DEAL_PRODUCTS)
for p in DEAL_PRODUCTS[:14]:
    discount = round((1 - p.price / p.original_price) * 100, 1)
    db.add(Deal(product_id=p.id, discount_percent=discount, ends_at=now + timedelta(days=5), is_active=True))

# ============================================================
# BANNERS
# ============================================================

BANNERS = [
    ("Big Diwali Sale - Up to 40% Off", True),
    ("New iPhone 15 Launch", True),
    ("Laptop Carnival - Flat 5000 Off", False),
    ("Headphones Week - Up to 50% Off", True),
    ("MacBook Air M2 - Now Available", True),
    ("Republic Day Mega Sale", False),
]
for b_idx, (title, active) in enumerate(BANNERS):
    db.add(Banner(
        title=title, image_url=BANNER_IMAGE_URLS[b_idx % len(BANNER_IMAGE_URLS)],
        link_url="/ecommerce/categories", is_active=active,
    ))

# ============================================================
# SUPPORT TICKETS (both domains, threaded)
# ============================================================

TICKET_SUBJECTS = [
    ("Order not delivered yet", "My order #TK12345 is delayed by 3 days."),
    ("Wrong item received", "I ordered headphones but got a smartwatch."),
    ("Refund request", "Product was damaged, please refund."),
    ("Battery draining fast", "The smartwatch battery drains within a few hours."),
    ("Need invoice copy", "Please resend the GST invoice for my last order."),
    ("Exchange request", "I'd like to exchange this for a different size/color."),
    ("Payment deducted but order not placed", "Amount was deducted but I don't see the order."),
]
AGRI_TICKET_SUBJECTS = [
    ("Fertilizer bag damaged on arrival", "The NPK fertilizer bag was torn and partially spilled."),
    ("Wrong seed variety delivered", "I ordered hybrid maize but received paddy seeds instead."),
    ("Delayed delivery during sowing season", "Need this urgently, delivery is already 4 days late."),
]
ADMIN_REPLIES = [
    "Thanks for reaching out — we're looking into this right away.",
    "We've escalated this to our logistics team, you'll hear back within 24 hours.",
    "Apologies for the inconvenience caused. We're processing this for you now.",
]
CUSTOMER_FOLLOWUPS = [
    "Any update on this? It's been a while.",
    "Thanks, please let me know once it's sorted.",
    "Okay, I'll wait. Please keep me posted.",
]

def seed_tickets(subjects, people):
    for subject, message in subjects:
        person = random.choice(people)
        status = random.choice(list(TicketStatus))
        created = now - timedelta(days=random.randint(0, 7))
        ticket = SupportTicket(customer_id=person.id, subject=subject, message=message, status=status, created_at=created)
        db.add(ticket)
        db.flush()
        db.add(TicketMessage(ticket_id=ticket.id, sender="customer", message=message, created_at=created))
        if status != TicketStatus.open:
            db.add(TicketMessage(
                ticket_id=ticket.id, sender="admin", message=random.choice(ADMIN_REPLIES),
                created_at=created + timedelta(hours=random.randint(2, 20)),
            ))
            if status == TicketStatus.closed:
                db.add(TicketMessage(
                    ticket_id=ticket.id, sender="customer", message=random.choice(CUSTOMER_FOLLOWUPS),
                    created_at=created + timedelta(hours=random.randint(21, 30)),
                ))
                db.add(TicketMessage(
                    ticket_id=ticket.id, sender="admin", message="Glad we could help! Marking this as resolved. Reach out anytime.",
                    created_at=created + timedelta(hours=random.randint(31, 40)),
                ))

seed_tickets(TICKET_SUBJECTS, customer_objs)
seed_tickets(AGRI_TICKET_SUBJECTS, farmer_objs)

# ============================================================
# CART + WISHLIST (both domains)
# ============================================================

for customer in customer_objs[:8]:
    for p in random.sample(product_objs, k=random.randint(1, 4)):
        db.add(CartItem(customer_id=customer.id, product_id=p.id, quantity=random.randint(1, 2)))

for customer in customer_objs[:10]:
    for p in random.sample(product_objs, k=random.randint(2, 5)):
        db.add(WishlistItem(customer_id=customer.id, product_id=p.id))

for farmer in farmer_objs[:6]:
    for p in random.sample(agri_product_objs, k=random.randint(1, 3)):
        db.add(CartItem(customer_id=farmer.id, product_id=p.id, quantity=random.randint(1, 3)))

for farmer in farmer_objs[:7]:
    for p in random.sample(agri_product_objs, k=random.randint(2, 4)):
        db.add(WishlistItem(customer_id=farmer.id, product_id=p.id))

# ============================================================
# CROPS (My Crops)
# ============================================================

CROP_NAMES = [
    ("Tomato", "Hybrid", 2.5), ("Maize", "BT Hybrid", 4.0), ("Cotton", "Bt Cotton", 3.2),
    ("Paddy", "BPT 5204", 5.0), ("Chilli", "Hybrid", 1.8), ("Wheat", "HD-2967", 3.5),
    ("Sugarcane", "Co-0238", 2.0), ("Groundnut", "TMV-2", 1.5),
]

crop_objs = []
for farmer in farmer_objs:
    for crop_name, variety, _ in random.sample(CROP_NAMES, k=random.randint(1, 3)):
        crop = Crop(
            customer_id=farmer.id, name=crop_name, variety=variety,
            area_acres=round(random.uniform(0.5, 6.0), 1),
            planted_on=now - timedelta(days=random.randint(10, 90)),
            notes=f"{crop_name} planted this season, monitoring growth regularly.",
            created_at=now - timedelta(days=random.randint(10, 90)),
        )
        db.add(crop)
        db.flush()
        crop_objs.append(crop)

# ============================================================
# CROP ISSUES (AI-reported)
# ============================================================

ISSUE_DESCRIPTIONS = {
    IssueType.leaf_disease: "Yellow spots appearing on leaves, spreading across the field.",
    IssueType.pest_attack: "Found small insects eating through the leaves, worried about spread.",
    IssueType.nutrient_deficiency: "Plants look pale and growth has slowed down significantly.",
    IssueType.weather_damage: "Recent heavy rains have damaged a section of the crop.",
    IssueType.other: "Noticed unusual wilting in part of the field, not sure of the cause.",
}
AI_RECOMMENDATIONS = {
    IssueType.leaf_disease: "This looks like early-stage leaf blight. Apply a copper-based fungicide spray and ensure proper field drainage to prevent spread.",
    IssueType.pest_attack: "Likely a pest infestation. Use a neem-based bio-pesticide spray in the early morning or evening, and monitor for 3-4 days.",
    IssueType.nutrient_deficiency: "Symptoms suggest nitrogen deficiency. Apply a balanced NPK fertilizer and consider a foliar spray for faster recovery.",
    IssueType.weather_damage: "For weather-damaged crops, remove affected plants, improve drainage, and avoid additional fertilizer until recovery is visible.",
    IssueType.other: "Our agriculture experts will review this issue and follow up with tailored advice shortly.",
}
ISSUE_STATUSES = [IssueStatus.reported, IssueStatus.under_review, IssueStatus.resolved]

for _ in range(18):
    farmer = random.choice(farmer_objs)
    farmer_crops = [c for c in crop_objs if c.customer_id == farmer.id]
    issue_type = random.choice(list(IssueType))
    db.add(CropIssue(
        customer_id=farmer.id,
        crop_id=random.choice(farmer_crops).id if farmer_crops and random.random() > 0.2 else None,
        issue_type=issue_type,
        description=ISSUE_DESCRIPTIONS[issue_type],
        status=random.choice(ISSUE_STATUSES),
        ai_recommendation=AI_RECOMMENDATIONS[issue_type],
        created_at=now - timedelta(days=random.randint(0, 20)),
    ))

# ============================================================
# ADVISORIES & TIPS
# ============================================================

ADVISORIES = [
    ("Best time to sow Paddy this season", "Sow paddy seeds in the first two weeks of June for optimal monsoon alignment. Ensure field is well-leveled before transplanting.", "Paddy"),
    ("Managing water stress in Cotton", "Cotton needs consistent moisture during flowering. Use drip irrigation to maintain soil moisture without waterlogging.", "Cotton"),
    ("Organic pest control for Tomato", "Neem oil spray every 10-14 days helps control aphids and whiteflies naturally without harming beneficial insects.", "Tomato"),
    ("Soil testing before Maize sowing", "Test soil pH and nutrient levels before sowing maize. Ideal pH range is 5.8-7.0 for best yield.", "Maize"),
    ("Post-harvest storage tips for Wheat", "Store wheat in moisture-proof containers below 12% grain moisture to prevent fungal growth and pest infestation.", "Wheat"),
]
for title, content, crop_type in ADVISORIES:
    db.add(Advisory(title=title, content=content, crop_type=crop_type, created_at=now - timedelta(days=random.randint(0, 30))))

# ============================================================
# SCHEMES & ANNOUNCEMENTS
# ============================================================

SCHEMES = [
    ("PM-KISAN Samman Nidhi", "Income support of Rs. 6,000 per year for all eligible farmer families, paid in 3 installments.", True),
    ("Soil Health Card Scheme", "Free soil testing and health cards for farmers to optimize fertilizer use and improve soil quality.", True),
    ("Pradhan Mantri Fasal Bima Yojana", "Crop insurance scheme protecting farmers against yield losses due to natural calamities.", True),
    ("Kisan Credit Card (KCC)", "Easy access to credit for farmers to meet agricultural and allied activity expenses at low interest.", True),
    ("Rashtriya Krishi Vikas Yojana", "State-level scheme providing funding for agriculture and allied sector development projects.", False),
]
for title, description, active in SCHEMES:
    db.add(Scheme(title=title, description=description, link_url="https://pmkisan.gov.in", is_active=active, created_at=now - timedelta(days=random.randint(0, 45))))

# ============================================================
# AI KNOWLEDGE BASE: CURATED ARTICLES + SEEDED PDF GUIDES
# ============================================================

for domain, title, content in KNOWLEDGE_ARTICLES:
    db.add(KnowledgeBase(
        title=title,
        content=content,
        domain=domain,
        language=Language.en,
        created_at=now - timedelta(days=random.randint(0, 8)),
    ))

seed_pdf_root = Path(__file__).resolve().parents[2] / "output" / "pdf"
for filename, domain in SEEDED_GUIDES:
    pdf_path = seed_pdf_root / filename
    if not pdf_path.exists():
        raise FileNotFoundError(f"Seeded knowledge PDF is missing: {pdf_path}")
    pdf_bytes = pdf_path.read_bytes()
    page_count, extracted_chunks = extract_pdf_chunks(pdf_bytes)
    document = KnowledgeDocument(
        original_filename=filename,
        content_type="application/pdf",
        size_bytes=len(pdf_bytes),
        page_count=page_count,
        domain=domain,
        language=Language.en,
        created_by=admin_user.id,
    )
    db.add(document)
    db.flush()
    for chunk_index, (page_number, content) in enumerate(extracted_chunks):
        db.add(KnowledgeChunk(
            document_id=document.id,
            chunk_index=chunk_index,
            page_number=page_number,
            content=content,
        ))

db.commit()
db.close()

print("Seed complete.")
print(f"  categories: {len(CATEGORIES) + len(AGRI_CATEGORIES)} ({len(CATEGORIES)} ecommerce, {len(AGRI_CATEGORIES)} agriculture)")
print(f"  products: {len(product_objs) + len(agri_product_objs)} ({len(product_objs)} ecommerce, {len(agri_product_objs)} agriculture)")
print(f"  customers: {len(customer_objs)}, farmers: {len(farmer_objs)}, admin: 1")
print(f"  crops: {len(crop_objs)}, crop issues: 18, advisories: {len(ADVISORIES)}, schemes: {len(SCHEMES)}")
print(f"  knowledge articles: {len(KNOWLEDGE_ARTICLES)}, seeded PDF guides: {len(SEEDED_GUIDES)}")
print(f"  demo login password for all seeded accounts: '{DEMO_PASSWORD}'")
