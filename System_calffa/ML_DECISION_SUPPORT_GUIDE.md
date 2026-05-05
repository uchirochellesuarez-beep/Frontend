# ML-Based Loaning AI Decision Support System - Integration Guide

## 📋 Overview

This document describes the Machine Learning-based Loaning AI Decision Support system for the CALLFA farmer cooperative. The system analyzes historical loan and repayment data to classify farmers and provide actionable insights for loan administrators.

## ✨ Key Features

1. **Automated Credit Scoring** - Generates 0-100 credit scores based on historical behavior
2. **Risk Classification** - Categorizes farmers as Good, Average, or High-Risk payers
3. **Payment Analysis** - Tracks on-time vs late payments with detailed metrics
4. **Barangay Analytics** - Provides risk summaries at the barangay level
5. **High-Risk Monitoring** - Identifies farmers needing close monitoring
6. **Decision Support** - Provides recommendations without automatic approval/denial

## 🏗️ System Architecture

### Backend Components

#### 1. ML Module: `/backend/ml/creditAnalyzer.js`
- **Purpose**: Core ML engine for credit analysis
- **Key Functions**:
  - `generateFarmerAssessment(farmerId)` - Generate assessment for one farmer
  - `generateAllFarmerAssessments(barangayFilter)` - Generate assessments for multiple farmers
  - `getBarangayRiskSummary(barangayId)` - Get risk distribution for barangay
  - `calculateCreditScore()` - Calculate weighted credit score
  - `classifyFarmer()` - Classify as Good/Average/High-Risk

- **Scoring Weights**:
  - Payment History: 40%
  - Default History: 30%
  - Loan Volume: 15%
  - Activity Recency: 15%

- **Classification Thresholds**:
  - GOOD PAYER: Score ≥ 70
  - AVERAGE PAYER: Score 40-69
  - HIGH-RISK PAYER: Score < 40

#### 2. API Routes: `/backend/routes/ml-assessments.js`
Endpoints:
- `GET /api/ml-assessments/farmer/:farmerId` - Get farmer assessment
- `GET /api/ml-assessments/all` - Get all assessments (with barangay filter)
- `GET /api/ml-assessments/barangay/:barangayId/summary` - Get barangay risk summary
- `GET /api/ml-assessments/barangay/:barangayId/high-risk` - Get high-risk farmers in barangay
- `GET /api/ml-assessments/eligibility/:farmerId` - Check loan eligibility with assessment
- `GET /api/ml-assessments/stats/:farmerId` - Get detailed statistics
- `POST /api/ml-assessments/recalculate/:farmerId` - Recalculate assessment

#### 3. Server Integration
- Routes added to `/backend/server.js` (line ~48)
- Registered at `/api/ml-assessments`

### Frontend Components

#### 1. `FarmerCreditAssessment.vue` (`/src/components/`)
- **Purpose**: Display individual farmer assessment
- **Features**:
  - Credit score visualization
  - Score component breakdown (weighted)
  - Loan history statistics
  - Payment rate metrics
  - Refresh functionality

#### 2. `BarangayRiskSummary.vue` (`/src/components/`)
- **Purpose**: Barangay-level risk analysis dashboard
- **Features**:
  - Total farmer count by risk level
  - Average credit score
  - Risk distribution pie chart
  - Farmer list by category
  - Responsive tables

#### 3. `HighRiskMonitoring.vue` (`/src/components/`)
- **Purpose**: Monitor high-risk farmers requiring intervention
- **Features**:
  - High-risk farmer list with alerts
  - Payment difficulty indicators
  - Recommended actions
  - Search and filtering
  - Link to full assessments

#### 4. `LoanAIAssessmentPage.vue` (`/src/views/`)
- **Purpose**: Main dashboard integrating all components
- **Tabs**:
  1. Barangay Risk Analysis
  2. High-Risk Farmers Monitoring
  3. Individual Assessment/Search
  4. Settings & Information

## 🔌 Integration Steps

### Step 1: Backend Verification

1. Ensure `/backend/ml/creditAnalyzer.js` exists
2. Ensure `/backend/routes/ml-assessments.js` exists
3. Verify server.js has been updated:
   ```javascript
   const mlAssessmentsRoutes = require('./routes/ml-assessments');
   app.use('/api/ml-assessments', mlAssessmentsRoutes);
   ```
4. Restart backend server
5. Test endpoint: `GET http://localhost:3000/api/ml-assessments/farmer/1`

### Step 2: Frontend Components

All components are created in:
- Components: `/farmer-registration/src/components/`
  - `FarmerCreditAssessment.vue`
  - `BarangayRiskSummary.vue`
  - `HighRiskMonitoring.vue`
- Pages: `/farmer-registration/src/views/`
  - `LoanAIAssessmentPage.vue`

### Step 3: Router Integration

Add to `/farmer-registration/src/router/index.js` or equivalent:

```javascript
{
  path: '/loan-ai-assessment',
  name: 'LoanAIAssessment',
  component: () => import('../views/LoanAIAssessmentPage.vue'),
  meta: {
    requiresAuth: true,
    role: ['admin', 'loan_officer', 'treasurer', 'president']
  }
}
```

### Step 4: Navigation Menu

Add link to admin/sidebar menu:
```vue
<li>
  <router-link to="/loan-ai-assessment">
    <i class="fas fa-brain"></i>
    Loan AI Assessment
  </router-link>
</li>
```

### Step 5: Existing AdminLoansPage Integration (Optional)

Add AI Assessment button to AdminLoansPage:
```vue
<button @click="openAIAssessment" class="btn btn-info">
  <i class="fas fa-brain"></i> View AI Assessment
</button>
```

## 📊 How It Works

### Data Flow

1. **Data Collection**
   - Farmers table: Profile information
   - Loans table: Loan history and status
   - Loan_payments table: Individual payments

2. **Analysis**
   - Calculate repayment statistics per farmer
   - Compute payment history score (on-time rate)
   - Compute default history score (default rate)
   - Compute loan volume score (number of completed loans)
   - Compute activity recency score (recent activity)
   - Combine weighted scores into credit score

3. **Classification**
   - Classify based on credit score thresholds
   - Generate risk level (LOW/MEDIUM/HIGH)
   - Provide description and recommendations

4. **Output**
   - Display to loan officers/admin
   - Support informed decision-making
   - Identify high-risk farmers for monitoring

### Example Assessment Output

```json
{
  "farmerId": 5,
  "farmerName": "Juan Dela Cruz",
  "assessment": {
    "creditScore": 75,
    "classification": "GOOD_PAYER",
    "displayName": "Good Payer",
    "riskLevel": "LOW",
    "description": "Consistently pays loans on time with minimal defaults"
  },
  "statistics": {
    "totalLoans": 3,
    "completedLoans": 3,
    "activeLoans": 0,
    "defaultedLoans": 0,
    "paymentRateOnTime": 95.5,
    "defaultRate": 0,
    "totalBorrowed": 15000.00,
    "totalRepaid": 15000.00
  },
  "scoreComponents": {
    "paymentHistoryScore": 100,
    "defaultHistoryScore": 100,
    "loanVolumeScore": 50,
    "activityRecencyScore": 75
  }
}
```

## 🔒 Security & Permissions

- Requires authentication token
- Role-based access (admin, loan_officer, treasurer, president)
- Barangay-level filtering for officers
- Admins can see all barangays

## ⚖️ Important Limitations

1. **Decision Support Only**: ML classifications are informational for decision support
2. **No Automatic Approval**: Final loan decisions remain with administrators
3. **No Automatic Denial**: High-risk classification does not auto-reject loans
4. **Existing Eligibility Rule**: Loan eligibility still requires zero outstanding balance
5. **Historical Data Required**: New farmers with no loan history may have neutral scores

## 🧪 Testing

### Manual Testing Steps

1. **Verify Backend API**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/ml-assessments/farmer/1
   ```

2. **Test Barangay Summary**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/ml-assessments/barangay/1/summary
   ```

3. **Test High-Risk List**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/ml-assessments/barangay/1/high-risk
   ```

4. **UI Testing**
   - Navigate to `/loan-ai-assessment`
   - Select barangay and view risk analysis
   - Search for individual farmer
   - View high-risk farmers list

### Expected Behavior

- Credit scores should range 0-100
- Classifications should match score thresholds
- Payment rates should reflect actual payment history
- High-risk list should only show farmers with score < 40
- Barangay summary should sum to total farmer count

## 📈 Future Enhancements

1. **Export Reports** - PDF/CSV export of assessments
2. **Trend Analysis** - Track scoring trends over time
3. **Alerts** - Automated alerts for newly high-risk farmers
4. **Custom Thresholds** - Allow admins to customize classification thresholds
5. **Predictive Models** - Predict loan default probability
6. **Integration with LMS** - Auto-flag high-risk in loan application process
7. **Mobile App** - Mobile-friendly monitoring dashboard
8. **API Rate Limiting** - Protect against abuse

## 🐛 Troubleshooting

### No assessments returned
- Check farmer has loan history
- Verify farmer_id exists in database
- Check database connection

### Backend route not found
- Ensure server.js has been restarted
- Verify routes are imported and registered
- Check for typos in endpoint paths

### Frontend components not loading
- Check browser console for errors
- Verify component imports in pages
- Ensure all dependencies are installed (Chart.js for charts)

### Authorization errors
- Verify token is being passed
- Check authentication middleware
- Verify user role has access

## 📞 Support

For issues or questions about the ML system:
1. Check error messages in browser console
2. Review backend logs for API errors
3. Verify database contains expected data
4. Check auth tokens are valid

## 📝 Notes

- System uses fuzzy date calculations (months = 30 days)
- Payment history calculated from approved_date to payment_date
- Only completed and paid loans count toward completion rate
- New farmers with no loans get neutral (50) scores
- All monetary values are in Philippine Pesos (₱)
