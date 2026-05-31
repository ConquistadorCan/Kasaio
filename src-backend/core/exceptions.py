class AppError(Exception):
    status_code = 400

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class NotFoundError(AppError):
    status_code = 404


class BusinessRuleError(AppError):
    status_code = 400


class ConflictError(AppError):
    status_code = 409
