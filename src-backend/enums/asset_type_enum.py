import enum


class AssetType(enum.Enum):
    COMMODITY = "COMMODITY"
    CRYPTOCURRENCY = "CRYPTOCURRENCY"
    TEFAS_FUND = "TEFAS_FUND"
    ETF = "ETF"
    EUROBOND = "EUROBOND"