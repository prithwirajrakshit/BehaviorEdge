# Step-by-Step Integration Plan: Merging Trading Journal into BehaviorEdge

This updated plan outlines the sequential steps to merge the **Journal App** into the **BehaviorEdge** platform. 

Based on your preferences, the trading rules systems will be **unified into a single database table and interface**, and the database will **start fresh** with no data migration.

---

## Phase 1: Database Schema Integration (Backend)

### Step 1.1: Unify the Rules Table
Modify the existing `Rule` model in BehaviorEdge's `backend/models.py`. We will merge the properties of both systems into one single `rules` table.

*   **Current BehaviorEdge `Rule`**: `id`, `user_id`, `rule_text`
*   **Journal App `trading_rules`**: `id`, `rule_text`, `category`, `is_active`, `times_checked`, `times_broken`
*   **Unified `Rule` Model**:
    ```python
    class Rule(Base):
        __tablename__ = "rules"
        id = Column(Integer, primary_key=True, index=True)
        user_id = Column(Integer, ForeignKey("users.id"))
        rule_text = Column(Text, nullable=False)
        category = Column(String, default="General")
        is_active = Column(Boolean, default=True)
        times_checked = Column(Integer, default=0)
        times_broken = Column(Integer, default=0)
        created_at = Column(DateTime, default=datetime.datetime.utcnow)
        
        user = relationship("User", back_populates="rules") # Add bi-directional relationship if needed
    ```

### Step 1.2: Add Journal Models to `models.py`
Add the remaining Journal-specific models to `backend/models.py`, setting foreign keys to `users.id` for secure, multi-tenant isolation:
1.  `JournalTrade` (table `journal_trades`): Scoped by `user_id`.
2.  `JournalDailyNote` (table `journal_daily_notes`): Scoped by `user_id` and unique per date.
3.  `JournalWeeklyGoal` (table `journal_weekly_goals`): Scoped by `user_id` and unique per week start date.
4.  `JournalAccountBalance` (table `journal_account_balances`): Scoped by `user_id`.
5.  `JournalMarketEvent` (table `journal_market_events`): Scoped by `user_id`.
6.  `JournalRuleCheck` (table `journal_rule_checks`): Connects a trade to the unified `rules` table, tracking whether a rule was followed or broken.

### Step 1.3: Update Pydantic Schemas
Update `backend/schemas.py` to add validation models for:
*   `JournalTrade` (Create, Update, Out schemas)
*   `DailyNote` (Upsert, Out schemas)
*   `WeeklyGoal` (Upsert, Out schemas)
*   `AccountBalance` (Create, Out schemas)
*   `MarketEvent` (Create, Update, Out schemas)
*   `Rule` (Update, Out schemas - expanding the existing Rule schema)
*   `RuleCheck` (Bulk upload schema)

---

## Phase 2: Backend API Development

### Step 2.1: Consolidate the Rules Router
Modify `backend/routers/rules.py` to support the unified `Rule` model. 
*   Support CRUD operations for the unified rules.
*   Allow categorizing, activating/deactivating, and pulling metrics (`times_checked`, `times_broken`) on a per-user basis.

### Step 2.2: Create Journal Trades Router
Create `backend/routers/journal_trades.py` to handle the core trade operations:
*   `GET /api/journal/trades` (with filters for outcome, session, setup type, direction, date ranges).
*   `POST /api/journal/trades` (logs a trade, calculates net PnL, handles confluences and mistakes).
*   `PUT /api/journal/trades/{id}` (edits a trade).
*   `DELETE /api/journal/trades/{id}` (deletes a trade).
*   `DELETE /api/journal/trades` (wipes the user's trade history).
*   `GET /api/journal/analytics/summary` (calculates win rates, profit factors, averages).
*   `GET /api/journal/analytics/charts` (processes cumulative equity curves, win rates by session, PnL by setup, and confluence performance for Recharts).
*   `GET /api/journal/analytics/fees` (calculates drag, biggest fees, and wins turned to losses due to fees).

### Step 2.3: Create Journal Elements Router
Create `backend/routers/journal_elements.py` to handle auxiliary views:
*   `GET/POST /api/journal/daily_notes` (upsert daily review notes).
*   `GET/POST /api/journal/weekly_goals` (upsert weekly targets).
*   `GET/POST/DELETE /api/journal/account_balance` (equity curve logs).
*   `GET/POST/PUT/DELETE /api/journal/market_events` (macro calendar tracker).
*   `POST /api/journal/rule_checks/bulk` (audits rule compliance per trade, incrementing `times_checked` and `times_broken` in the unified `rules` table using an atomic database transaction).

### Step 2.4: Register Routers in `main.py`
*   Import and register the new routers in `backend/main.py` under the `/api/journal` prefix.
*   Ensure all new endpoints require authorization via the `get_user` dependency.

---

## Phase 3: Frontend Component Porting & Translation

### Step 3.1: Port Components to BehaviorEdge
Copy the 17 UI components from the standalone app to the BehaviorEdge frontend under a new directory: `frontend/src/components/journal/`.

### Step 3.2: Translate from TypeScript to JavaScript
Convert all ported `.tsx` files to `.jsx`:
*   Strip TypeScript typings (`ClientTrade`, `MarketType`, interfaces, types).
*   Change import extensions and verify React 19 compatibility.

### Step 3.3: Rewrite Frontend API Queries
*   Replace standard fetch blocks inside components with authenticated calls.
*   Include the JWT token (`Bearer ${localStorage.getItem('token')}`) in the headers.
*   Update endpoint URLs to point to the new `/api/journal/` paths.

---

## Phase 4: UI Shell Integration

### Step 4.1: Create the Main Journal Page
Create `frontend/src/pages/JournalWorkspace.jsx`.
*   This page acts as the host viewport for the journal section.
*   Implement an elegant sub-navigation menu (such as a top-tab navigation header or a collapsible sub-sidebar) to switch between the 14 views of the journal app.
*   This ensures the main BehaviorEdge sidebar remains clean and un-cluttered.

### Step 4.2: Add Journal to the Sidebar
Modify `frontend/src/components/Sidebar.jsx`:
*   Import `BookOpen` from `lucide-react`.
*   Add the **Journal Workspace** item to `navItems`:
    ```javascript
    { id: 'journal', label: 'Journal Workspace', icon: BookOpen }
    ```

### Step 4.3: Wire the Page in App.jsx
Modify `frontend/src/App.jsx` to render `<JournalWorkspace />` when the active page state is `'journal'`.

### Step 4.4: Theme & Styling Alignment
*   Review the ported components and adjust their styling to match BehaviorEdge's ambient glowing dark theme.
*   Adapt font weights, button highlights, and panels to match BehaviorEdge's glassmorphism styles.

---

## Phase 5: Database Seeding & Verification

### Step 5.1: Automatically Generate Database Tables
*   Start the FastAPI server. SQLAlchemy will automatically create the new tables (`journal_trades`, `journal_daily_notes`, etc.) and alter the `rules` table in the PostgreSQL database.

### Step 5.2: Seed Default Rules
*   In the backend, write a startup seed hook. When a new user registers or logs in for the first time, if their `rules` table is empty, seed it with the 8 default trading rules (e.g., "Never risk more than 1% per trade", "Do not trade after 2 consecutive losses").

### Step 5.3: Verify Multi-User Data Isolation
*   Create User A and User B.
*   Log trades, daily notes, and compliance checks in User A.
*   Log in as User B and verify that User B's dashboard, trades list, and calendars are completely empty.
*   Verify that User A's data remains untouched.
