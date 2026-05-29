import enum


class AssetType(enum.Enum):
    STOCK = "stock"
    ETF = "etf"
    CRYPTO = "crypto"
    COMMODITY = "commodity"
    EUROBOND = "eurobond"
    TEFAS_FUND = "tefas_fund"
    BES = "bes"