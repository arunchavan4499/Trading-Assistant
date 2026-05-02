"""International symbol mappings for companies not on US exchanges."""

# Map common names/queries to their international ticker symbols
INTERNATIONAL_SYMBOLS_MAP = {
    # Tech companies
    "SAMSUNG": "005930.KS",  # Samsung Electronics, Korean Exchange
    "OPPO": "0P0000046H.KL",  # OPPO, Malaysia
    "HUAWEI": None,  # Not listed; Huawei is private
    "XIAOMI": "1810.HK",  # Xiaomi, Hong Kong
    "HONOR": None,  # Honor is not public
    "ONEPLUS": None,  # OnePlus is not public
    "ZTE": "0763.HK",  # ZTE, Hong Kong
    
    # Automotive
    "BYD": "1211.HK",  # BYD, Hong Kong / 002594.SZ Shanghai
    "GEELY": "0175.HK",  # Geely, Hong Kong
    "NIO": "NIO",  # Nio - lists on US as ADR
    "XPeng": "XPEV",  # XPeng - lists on US as ADR
    "Li Auto": "LI",  # Li Auto - lists on US as ADR
    
    # Others
    "ALIBABA": "BABA",  # Alibaba - lists on US as ADR
    "TENCENT": "0700.HK",  # Tencent, Hong Kong
    "BAIDU": "BIDU",  # Baidu - lists on US as ADR
    "JD": "JD",  # JD.com - lists on US
    "MEITUAN": "3690.HK",  # Meituan, Hong Kong
}


def get_international_ticker(query: str) -> str | None:
    """Get international ticker for a company name query."""
    normalized = (query or "").strip().upper()
    return INTERNATIONAL_SYMBOLS_MAP.get(normalized)


def get_all_variants(company_name: str) -> list[str]:
    """Get all known ticker variants for a company."""
    normalized = (company_name or "").strip().upper()
    base_ticker = INTERNATIONAL_SYMBOLS_MAP.get(normalized)
    variants = [normalized]  # Add the original symbol
    if base_ticker:
        variants.append(base_ticker)
    return variants
