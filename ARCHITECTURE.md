# TipidBuddy - Architecture & Database Documentation

## 🏗️ Application Architecture

### Tech Stack
- **Frontend**: React 18.3 with TypeScript
- **Build Tool**: Vite 6.3
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts 2.15
- **Icons**: Lucide React
- **State Management**: React Context API
- **Storage**: Browser LocalStorage (offline-first)
- **Backend (Optional)**: Supabase (Firebase alternative)
- **Hosting**: Vercel Free Tier
- **PWA**: Progressive Web App support

### Architecture Pattern
```
┌─────────────────────────────────────────────┐
│           React Application                 │
├─────────────────────────────────────────────┤
│  App.tsx (Main Entry)                       │
│    ├── AppProvider (Context)                │
│    ├── Onboarding                           │
│    ├── Auth (Login/Register)                │
│    └── Main App                             │
│         ├── Dashboard                       │
│         ├── Add Expense                     │
│         ├── Budget Manager                  │
│         ├── Analytics                       │
│         ├── Profile                         │
│         └── Bottom Navigation               │
├─────────────────────────────────────────────┤
│  State Management (Context API)             │
│    ├── User State                           │
│    ├── Expenses State                       │
│    ├── Budgets State                        │
│    └── Savings Goals State                  │
├─────────────────────────────────────────────┤
│  Local Storage (Offline-First)              │
│    ├── tipidbuddy_user                      │
│    ├── tipidbuddy_users                     │
│    ├── tipidbuddy_expenses                  │
│    ├── tipidbuddy_budgets                   │
│    └── tipidbuddy_goals                     │
└─────────────────────────────────────────────┘
```

## 📊 Database Schema

### LocalStorage Schema (Current Implementation)

#### Users Collection (`tipidbuddy_users`)
```typescript
interface User {
  id: string;              // Format: user_${timestamp}
  name: string;            // User's full name
  email: string;           // Unique email address
  password: string;        // Plain text (demo only - use hashing in production)
  createdAt: string;       // ISO date string
}
```

#### Expenses Collection (`tipidbuddy_expenses`)
```typescript
interface Expense {
  id: string;              // Format: expense_${timestamp}
  userId: string;          // Foreign key to User.id
  amount: number;          // Expense amount in PHP (₱)
  category: 'Food' | 'Transport' | 'School' | 'Entertainment' | 'Others';
  description: string;     // Expense description/notes
  date: string;            // ISO date string (expense date)
  createdAt: string;       // ISO date string (record creation)
}
```

#### Budgets Collection (`tipidbuddy_budgets`)
```typescript
interface Budget {
  id: string;              // Format: budget_${timestamp}
  userId: string;          // Foreign key to User.id
  type: 'weekly' | 'monthly';
  amount: number;          // Budget limit in PHP (₱)
  category?: string;       // Optional: category-specific budget
  startDate: string;       // ISO date string
  endDate: string;         // ISO date string
}
```

#### Savings Goals Collection (`tipidbuddy_goals`)
```typescript
interface SavingsGoal {
  id: string;              // Format: goal_${timestamp}
  userId: string;          // Foreign key to User.id
  name: string;            // Goal name (e.g., "New Phone")
  targetAmount: number;    // Target amount in PHP (₱)
  currentAmount: number;   // Current saved amount in PHP (₱)
  deadline: string;        // ISO date string
  createdAt: string;       // ISO date string
}
```

### IndexedDB Schema (For Offline Enhancement)

```javascript
// Database: TipidBuddyDB
// Version: 1

// Object Stores:
{
  users: {
    keyPath: 'id',
    indexes: [
      { name: 'email', unique: true }
    ]
  },
  expenses: {
    keyPath: 'id',
    indexes: [
      { name: 'userId' },
      { name: 'date' },
      { name: 'category' }
    ]
  },
  budgets: {
    keyPath: 'id',
    indexes: [
      { name: 'userId' },
      { name: 'type' }
    ]
  },
  savingsGoals: {
    keyPath: 'id',
    indexes: [
      { name: 'userId' }
    ]
  }
}
```

### Supabase Schema (For Cloud Sync)

```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Users table (handled by Supabase Auth)
-- Uses built-in auth.users table

-- User Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Food', 'Transport', 'School', 'Entertainment', 'Others')),
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings Goals table
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_budgets_user_type ON budgets(user_id, type);
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);

-- Row Level Security Policies
CREATE POLICY "Users can view own expenses" 
  ON expenses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" 
  ON expenses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" 
  ON expenses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" 
  ON expenses FOR DELETE 
  USING (auth.uid() = user_id);

-- Similar policies for budgets and savings_goals
CREATE POLICY "Users can manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON savings_goals
  FOR ALL USING (auth.uid() = user_id);
```

## 🔄 Data Flow

### Expense Creation Flow
```
User Input (AddExpense Screen)
  ↓
Form Validation
  ↓
Context API (addExpense function)
  ↓
Generate ID & Timestamp
  ↓
Update Local State (React)
  ↓
Persist to LocalStorage
  ↓
Update UI (Dashboard/Analytics)
```

### Budget Monitoring Flow
```
User Sets Budget Limit
  ↓
Store in Context & LocalStorage
  ↓
Dashboard Calculates Current Spending
  ↓
Filter Expenses by Time Period
  ↓
Calculate Progress (spending/budget)
  ↓
Show Visual Progress Bar
  ↓
Display Alerts if Threshold Exceeded
```

## 📱 Component Structure

```
src/
├── app/
│   ├── App.tsx                 # Main application component
│   ├── components/
│   │   ├── BottomNav.tsx       # Mobile bottom navigation
│   │   ├── CategoryIcon.tsx    # Category icon component
│   │   └── ui/                 # Reusable UI components
│   ├── context/
│   │   └── AppContext.tsx      # Global state management
│   └── screens/
│       ├── Onboarding.tsx      # First-time user onboarding
│       ├── Auth.tsx            # Login/Register
│       ├── Dashboard.tsx       # Home screen with overview
│       ├── AddExpense.tsx      # Add/edit expense form
│       ├── BudgetScreen.tsx    # Budget management
│       ├── Analytics.tsx       # Charts and insights
│       └── Profile.tsx         # User profile & settings
└── styles/
    ├── fonts.css
    ├── index.css
    ├── tailwind.css
    └── theme.css
```

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--emerald-500: #10B981  /* Primary green */
--blue-500: #3B82F6     /* Secondary blue */
--yellow-500: #FBBF24   /* Accent yellow */
--purple-500: #8B5CF6   /* Analytics purple */

/* Category Colors */
Food:          #10B981 (emerald)
Transport:     #3B82F6 (blue)
School:        #8B5CF6 (purple)
Entertainment: #FBBF24 (yellow)
Others:        #6B7280 (gray)
```

### Typography
- Font Family: System fonts (-apple-system, BlinkMacSystemFont, "Segoe UI", etc.)
- Base Size: 16px
- Heading Weights: 500-700
- Body Weight: 400

### Spacing & Layout
- Mobile-first responsive design
- Max width: 512px (lg breakpoint)
- Padding: 16-24px
- Border Radius: 12-24px (rounded corners)

## 🔐 Security Considerations

### Current Implementation (Demo)
- Plain text passwords in LocalStorage
- No encryption
- Client-side only validation

### Production Recommendations
1. **Authentication**
   - Use Supabase Auth or Firebase Auth
   - Implement proper password hashing (bcrypt)
   - Add OAuth providers (Google, Facebook)
   
2. **Data Security**
   - Encrypt sensitive data in LocalStorage
   - Use HTTPS only
   - Implement CSRF protection
   
3. **Validation**
   - Server-side validation
   - Input sanitization
   - Rate limiting

## 📈 Performance Optimization

### Current Optimizations
1. **Code Splitting**: Lazy loading of screens
2. **Memoization**: useMemo for expensive calculations
3. **Local Storage**: Offline-first approach
4. **Efficient Re-renders**: Context API with selective updates

### Future Enhancements
1. **Virtual Scrolling**: For large expense lists
2. **Service Worker**: For true PWA offline support
3. **IndexedDB**: Replace LocalStorage for better performance
4. **Image Optimization**: Lazy load images and charts

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build
```bash
# Build for production
npm run build

# Output in dist/ folder
# Deploy dist/ to any static hosting
```

### Environment Variables
```env
# For Supabase Integration (Future)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Analytics & Tracking

### Built-in Analytics
- Total expenses by category
- Daily/weekly/monthly spending trends
- Budget utilization percentage
- Savings goal progress

### Future Metrics
- Average transaction size
- Most frequent expense categories
- Peak spending days/times
- Month-over-month comparisons

## 🔮 Future Enhancements

### Phase 2 Features
1. **Multi-currency Support**
2. **Recurring Expenses**
3. **Bill Reminders**
4. **Export to CSV/PDF**
5. **Shared Budgets (Family/Friends)**

### Phase 3 Features
1. **Bank Account Integration**
2. **Receipt Scanning (OCR)**
3. **AI-powered Insights**
4. **Gamification & Rewards**
5. **Social Features (Challenges)**

## 📝 Development Notes

### Running Locally
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Testing Scenarios
1. Create user account
2. Add expenses across different categories
3. Set weekly/monthly budgets
4. Create savings goals
5. View analytics and charts
6. Test offline functionality
7. Test on mobile devices

### Browser Support
- Chrome/Edge: ✅ Full support
- Safari: ✅ Full support
- Firefox: ✅ Full support
- Mobile browsers: ✅ Optimized
- IE11: ❌ Not supported

## 🤝 Contributing

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Add comments for complex logic

### Git Workflow
```bash
# Feature branch
git checkout -b feature/your-feature

# Commit with conventional commits
git commit -m "feat: add expense filtering"

# Push and create PR
git push origin feature/your-feature
```

## 📄 License

This project is open source and available for educational purposes.
Built for Filipino students to manage their finances effectively.
