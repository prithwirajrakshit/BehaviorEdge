from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Rule, User
from schemas import RuleCreate, RuleOut
from routers.auth import get_current_user
from typing import List

router = APIRouter(prefix="/rules", tags=["Rules"])

def get_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    return get_current_user(token, db)

@router.get("/", response_model=List[RuleOut])
def get_rules(user: User = Depends(get_user), db: Session = Depends(get_db)):
    return db.query(Rule).filter(Rule.user_id == user.id).all()

@router.post("/", response_model=RuleOut)
def add_rule(data: RuleCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    rule = Rule(user_id=user.id, rule_text=data.rule_text)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/{rule_id}", response_model=RuleOut)
def update_rule(rule_id: int, data: RuleCreate, user: User = Depends(get_user), db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(Rule.id == rule_id, Rule.user_id == user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.rule_text = data.rule_text
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/{rule_id}")
def delete_rule(rule_id: int, user: User = Depends(get_user), db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(Rule.id == rule_id, Rule.user_id == user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted"}
