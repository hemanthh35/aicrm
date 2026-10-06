"""Stable real-photo assets used by the demo catalog.

The URLs point to Unsplash's image CDN with fixed photo IDs, so reseeding does
not produce a different random image for the same product category.
"""

_PARAMS = "?auto=format&fit=crop&w=800&h=800&q=85"

PRODUCT_IMAGE_POOLS: dict[str, list[str]] = {
    "Laptops": [
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
        "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6",
        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
    ],
    "Mobiles": [
        "https://images.unsplash.com/photo-1589492477829-5e65395b66cc",
        "https://images.unsplash.com/photo-1622400661434-723c5ea4bba2",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
        "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd",
        "https://images.unsplash.com/photo-1556656793-08538906a9f8",
    ],
    "Tablets": [
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0",
        "https://images.unsplash.com/photo-1561154464-82e9adf32764",
    ],
    "Headphones": [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b",
    ],
    "Smartwatches": [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12",
        "https://images.unsplash.com/photo-1551816230-ef5deaed4a26",
    ],
    "Cameras": [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
    ],
    "Accessories": [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
        "https://images.unsplash.com/photo-1527814050087-3793815479db",
        "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b",
    ],
    "Seeds": [
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b",
    ],
    "Fertilizers": [
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b",
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae",
        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9",
    ],
    "Farming Tools": [
        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b",
    ],
    "Irrigation": [
        "https://images.unsplash.com/photo-1586771107445-d3ca888129ff",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
    ],
    "Pesticides": [
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b",
    ],
}

BANNER_IMAGE_URLS = [
    "https://images.unsplash.com/photo-1681601988039-434de125ca06?auto=format&fit=crop&w=1200&h=400&q=85",
    "https://images.unsplash.com/photo-1590643924142-b1b492f1dddc?auto=format&fit=crop&w=1200&h=400&q=85",
    "https://images.unsplash.com/photo-1707537286746-7d29964135ab?auto=format&fit=crop&w=1200&h=400&q=85",
    "https://images.unsplash.com/photo-1648726131667-55cc0588b1f6?auto=format&fit=crop&w=1200&h=400&q=85",
    "https://images.unsplash.com/photo-1590643924142-b1b492f1dddc?auto=format&fit=crop&w=1200&h=400&q=85",
    "https://images.unsplash.com/photo-1681601988039-434de125ca06?auto=format&fit=crop&w=1200&h=400&q=85",
]


def product_image_url(category: str, index: int = 0) -> str:
    pool = PRODUCT_IMAGE_POOLS.get(category)
    if not pool:
        pool = PRODUCT_IMAGE_POOLS["Accessories"]
    return f"{pool[index % len(pool)]}{_PARAMS}"
