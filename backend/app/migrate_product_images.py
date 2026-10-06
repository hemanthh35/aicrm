"""Replace legacy random placeholder images in an existing demo database."""

from collections import defaultdict

from app.db.session import SessionLocal
from app.models.models import Banner, Category, Product
from app.product_images import BANNER_IMAGE_URLS, product_image_url


db = SessionLocal()
try:
    products = (
        db.query(Product)
        .join(Category, Product.category_id == Category.id)
        .order_by(Product.id)
        .all()
    )
    indexes: defaultdict[str, int] = defaultdict(int)
    updated_products = 0
    for product in products:
        if product.image_url and "picsum.photos" not in product.image_url:
            continue
        category_name = product.category.name if product.category else "Accessories"
        product.image_url = product_image_url(category_name, indexes[category_name])
        indexes[category_name] += 1
        updated_products += 1

    banners = db.query(Banner).order_by(Banner.id).all()
    updated_banners = 0
    for index, banner in enumerate(banners):
        if banner.image_url and "picsum.photos" not in banner.image_url:
            continue
        banner.image_url = BANNER_IMAGE_URLS[index % len(BANNER_IMAGE_URLS)]
        updated_banners += 1

    db.commit()
    print(f"Updated {updated_products} product images and {updated_banners} banner images.")
finally:
    db.close()
