# Test script for courier rates API

$apiUrl = "http://localhost:5000/api/rates/courier"
$token = "Bearer YOUR_TOKEN_HERE" # Update with actual token

# Sample test data (minimal)
$testData = @{
    company_id = 10
    rates_data = @(
        @{
            courier_type = "Dox"
            row_name = "Within City"
            slab_type = "Slab 2"
            rates = @{
                rate_1 = "1"
                rate_2 = "1"
            }
        },
        @{
            courier_type = "Dox"
            row_name = "Within State"
            slab_type = "Slab 2"
            rates = @{
                rate_1 = "1"
                rate_2 = "1"
            }
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending request to: $apiUrl"
Write-Host "📋 Data: $testData"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $apiUrl `
        -Method POST `
        -Headers @{ 
            "Content-Type" = "application/json"
            "Authorization" = $token
        } `
        -Body $testData `
        -ErrorAction Stop

    Write-Host "✅ Success! Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ Error! Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Error Details:"
    try {
        $errorResponse = $_.Exception.Response.Content | ConvertFrom-Json
        Write-Host ($errorResponse | ConvertTo-Json -Depth 10)
    } catch {
        Write-Host $_.Exception.Message
    }
}