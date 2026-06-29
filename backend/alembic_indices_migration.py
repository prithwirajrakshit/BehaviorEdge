"""Add performance indexes to foreign keys and filtered columns

Revision ID: 5f190bf824c8
Revises: None
Create Date: 2026-06-29 18:50:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5f190bf824c8'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 1. Indexes on foreign keys to optimize joins and cascading deletes
    op.create_index('idx_profiles_user_id', 'profiles', ['user_id'])
    op.create_index('idx_trades_user_id', 'trades', ['user_id'])
    op.create_index('idx_chat_messages_user_id', 'chat_messages', ['user_id'])
    op.create_index('idx_rules_user_id', 'rules', ['user_id'])
    op.create_index('idx_journal_trades_user_id', 'journal_trades', ['user_id'])
    op.create_index('idx_journal_daily_notes_user_id', 'journal_daily_notes', ['user_id'])
    op.create_index('idx_journal_weekly_goals_user_id', 'journal_weekly_goals', ['user_id'])
    op.create_index('idx_journal_account_balances_user_id', 'journal_account_balances', ['user_id'])
    op.create_index('idx_journal_market_events_user_id', 'journal_market_events', ['user_id'])
    
    # 2. Indexes on frequently filtered columns
    op.create_index('idx_journal_trades_date', 'journal_trades', ['date'])
    op.create_index('idx_journal_daily_notes_date', 'journal_daily_notes', ['date'])
    op.create_index('idx_journal_weekly_goals_week_start', 'journal_weekly_goals', ['week_start'])
    op.create_index('idx_processed_events_event_id', 'processed_events', ['event_id'])

def downgrade():
    op.drop_index('idx_profiles_user_id', 'profiles')
    op.drop_index('idx_trades_user_id', 'trades')
    op.drop_index('idx_chat_messages_user_id', 'chat_messages')
    op.drop_index('idx_rules_user_id', 'rules')
    op.drop_index('idx_journal_trades_user_id', 'journal_trades')
    op.drop_index('idx_journal_daily_notes_user_id', 'journal_daily_notes')
    op.drop_index('idx_journal_weekly_goals_user_id', 'journal_weekly_goals')
    op.drop_index('idx_journal_account_balances_user_id', 'journal_account_balances')
    op.drop_index('idx_journal_market_events_user_id', 'journal_market_events')
    
    op.drop_index('idx_journal_trades_date', 'journal_trades')
    op.drop_index('idx_journal_daily_notes_date', 'journal_daily_notes')
    op.drop_index('idx_journal_weekly_goals_week_start', 'journal_weekly_goals')
    op.drop_index('idx_processed_events_event_id', 'processed_events')
