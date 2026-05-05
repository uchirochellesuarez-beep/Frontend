# Test-Notifications.ps1
# Notification Testing Helper - No system date change needed!
# Usage: .\Test-Notifications.ps1

$API = "http://localhost:5000/api/test-notifications"

Clear-Host

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   NOTIFICATION TESTING - NO SYSTEM DATE CHANGE NEEDED" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Check if backend is running
Write-Host "Checking backend..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API/scenarios" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Backend not running or endpoints not available" -ForegroundColor Red
    Write-Host "Make sure backend is running: npm start" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "AVAILABLE TEST SCENARIOS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1️⃣  Due Tomorrow (💰 'Loan Due Tomorrow' notification)" -ForegroundColor Yellow
Write-Host "  2️⃣  On Due Date (📅 'Loan Due Today' notification)" -ForegroundColor Yellow
Write-Host "  3️⃣  Overdue (⚠️ 'Loan Overdue - Penalty Applied' notification)" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Select scenario (1-3)"

switch ($choice) {
    "1" {
        $testDate = "2026-03-09"
        $notification = "💰 Loan Due Tomorrow"
        break
    }
    "2" {
        $testDate = "2026-03-08"
        $notification = "📅 Loan Due Today"
        break
    }
    "3" {
        $testDate = "2026-03-07"
        $notification = "⚠️ Loan Overdue - Penalty Applied"
        break
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🧪 TESTING SCENARIO: $notification" -ForegroundColor Cyan
Write-Host "📅 Test Date: $testDate" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate notifications
Write-Host "Step 1️⃣ : Generating notifications for $testDate..." -ForegroundColor Yellow
try {
    $genResponse = Invoke-RestMethod -Uri "$API/generate-for-date/$testDate" -Method POST
    Write-Host "✅ Generated $($genResponse.generatedCount) notification(s)" -ForegroundColor Green
    Write-Host "   $($genResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generating notifications: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Check current test date
Write-Host "Step 2️⃣ : Checking test environment..." -ForegroundColor Yellow
try {
    $dateResponse = Invoke-RestMethod -Uri "$API/current-date" -Method GET
    Write-Host "✅ Test Mode Active: YES" -ForegroundColor Green
    Write-Host "   Test Date: $($dateResponse.testDate)" -ForegroundColor Cyan
    Write-Host "   Real Date: $($dateResponse.realDate)" -ForegroundColor Gray
    Write-Host "   Status: $($dateResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ Warning: Could not verify test date" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3️⃣ : Next Steps" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Open your app in browser (localhost:8080 or wherever it's running)" -ForegroundColor Cyan
Write-Host "  2. Refresh the page (Press F5)" -ForegroundColor Cyan
Write-Host "  3. Click the bell icon 🔔 in the top-right header" -ForegroundColor Cyan
Write-Host "  4. You should see notification: '$notification'" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: The notification will ONLY appear for the test date!" -ForegroundColor Yellow
Write-Host "   To reset to real date, run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   powershell -Command `"Invoke-RestMethod -Uri '$API/reset-date' -Method POST`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Or press the 'Reset Date' button below..." -ForegroundColor Yellow
Write-Host ""

$resetChoice = Read-Host "Do you want to reset to real date now? (Y/N)"
if ($resetChoice -eq "Y" -or $resetChoice -eq "y") {
    Write-Host ""
    Write-Host "Resetting to real date..." -ForegroundColor Yellow
    try {
        $resetResponse = Invoke-RestMethod -Uri "$API/reset-date" -Method POST
        Write-Host "✅ Reset successful!" -ForegroundColor Green
        Write-Host "   $($resetResponse.message)" -ForegroundColor Green
        Write-Host "   Current Date: $($resetResponse.date)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Error resetting date: $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host ""
Write-Host "✅ Test complete! Check your app now 🚀" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
