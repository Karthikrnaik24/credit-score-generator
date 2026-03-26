from pydantic import BaseModel
from typing import List

class Transaction(BaseModel):
    date: str
    amount: float
    type: str
    category: str

class TransactionRequest(BaseModel):
    transactions: List[Transaction]