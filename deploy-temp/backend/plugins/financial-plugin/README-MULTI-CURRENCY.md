# Multi-Currency & Internationalization System

## Overview

The Multi-Currency system allows CourseWorx to support multiple currencies for course pricing and payments. Each course can have a base currency and accept payments in multiple currencies with configurable exchange rates.

## Key Features

- **Base Currency per Course**: Each course has a primary currency for pricing
- **Multiple Payment Currencies**: Students can pay in their preferred currency
- **Custom Exchange Rates**: Course-specific exchange rate overrides
- **Bank Account Configuration**: Separate bank accounts for each currency
- **Exchange Rate History**: Complete audit trail of rate changes
- **Real-time Conversion**: Live currency conversion calculations

## Database Schema

### Tables Created

1. **currencies** - Currency definitions and bank account details
2. **exchange_rates** - Current exchange rates between currency pairs
3. **exchange_rate_history** - Historical record of all rate changes
4. **course_currencies** - Course-specific currency configurations

### Key Relationships

- `exchange_rates.fromCurrencyId` → `currencies.id`
- `exchange_rates.toCurrencyId` → `currencies.id`
- `course_currencies.courseId` → `courses.id`
- `course_currencies.baseCurrencyId` → `currencies.id`

## API Endpoints

### Currency Management

```http
GET    /api/financial/currencies              # List all currencies
GET    /api/financial/currencies/:id          # Get specific currency
POST   /api/financial/currencies              # Create currency (Admin)
PUT    /api/financial/currencies/:id          # Update currency (Admin)
```

### Exchange Rate Management

```http
GET    /api/financial/exchange-rates          # List exchange rates
POST   /api/financial/exchange-rates          # Create/update rate (Admin)
GET    /api/financial/exchange-rates/history  # Get rate history
```

### Course Currency Configuration

```http
GET    /api/financial/courses/:id/currency    # Get course currency config
POST   /api/financial/courses/:id/currency    # Set course currency config
```

### Currency Conversion

```http
GET    /api/financial/convert                 # Convert between currencies
```

## Usage Examples

### 1. Setting Up a Course with Multi-Currency Support

```javascript
// Configure course to accept USD as base, EUR and EGP as payment currencies
const courseCurrencyConfig = {
  baseCurrencyId: 'usd-currency-id',
  basePrice: 99.99,
  allowedPaymentCurrencies: ['eur-currency-id', 'egp-currency-id'],
  customExchangeRates: {
    'usd-currency-id-egp-currency-id': 30.50  // Custom USD to EGP rate
  }
};

await fetch(`/api/financial/courses/${courseId}/currency`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(courseCurrencyConfig)
});
```

### 2. Converting Currency Amounts

```javascript
// Convert 100 USD to EUR
const response = await fetch('/api/financial/convert?amount=100&from=USD&to=EUR');
const result = await response.json();

console.log(result.data);
// {
//   originalAmount: 100,
//   convertedAmount: 85.00,
//   fromCurrency: 'USD',
//   toCurrency: 'EUR',
//   exchangeRate: 0.85,
//   effectiveDate: '2024-12-19T10:30:00Z'
// }
```

### 3. Getting Course Prices in Multiple Currencies

```javascript
const coursePrices = await CurrencyService.getCoursePricesInCurrencies(
  courseId, 
  ['eur-currency-id', 'egp-currency-id']
);

coursePrices.forEach(price => {
  console.log(`${price.currency.name}: ${CurrencyService.formatCurrency(price.price, price.currency)}`);
});
```

## Frontend Components

### Currency Management Dashboard

Access at `/admin/currencies` for:
- Adding/editing currencies
- Managing exchange rates
- Viewing rate history
- Bank account configuration

### Course Currency Configuration

Use the `CourseCurrencyConfig` component in course creation/editing:
- Select base currency and price
- Choose allowed payment currencies
- Set custom exchange rates
- Preview converted prices

## Configuration

### Initial Setup

1. **Run Migration**:
   ```bash
   # Run the currency tables migration
   node backend/plugins/financial-plugin/migrations/001_create_currency_tables.js
   ```

2. **Seed Initial Data**:
   ```bash
   # Seed currencies and initial exchange rates
   node backend/plugins/financial-plugin/scripts/seed-currencies.js
   ```

3. **Setup Script**:
   ```bash
   # Run the complete setup
   node backend/scripts/setup-multi-currency.js
   ```

### Default Currencies

The system comes pre-configured with:
- USD (US Dollar) - Base currency
- EUR (Euro)
- GBP (British Pound)
- EGP (Egyptian Pound)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- JPY (Japanese Yen)
- CHF (Swiss Franc)

## Bank Account Configuration

Each currency can have its own bank account details stored as JSONB:

```json
{
  "accountType": "checking",
  "accountNumber": "1234567890",
  "bankName": "Example Bank",
  "bankAddress": "123 Main St, City, Country",
  "routingNumber": "123456789",  // For USD
  "iban": "GB29NWBK60161331926819",  // For EUR/GBP
  "swift": "NWBKGB2L",  // For international
  "bsb": "123456"  // For AUD
}
```

## Exchange Rate Management

### Automatic History Tracking

All exchange rate changes are automatically tracked:
- Previous and new rates
- Change percentage
- Change reason (manual, api, scheduled, correction)
- User who made the change
- Timestamp

### Rate Sources

Exchange rates can be sourced from:
- **manual** - Admin-entered rates
- **api** - External API integration
- **import** - Bulk import from files

## Security & Permissions

### Required Permissions

- `admin:financial` - Full currency management access
- `read:payments` - View currency information
- `write:payments` - Modify currency settings

### Authentication

All currency management endpoints require:
- Valid JWT token
- Appropriate role (super_admin for modifications)
- Course ownership for course-specific settings

## Integration Points

### Payment Processing

The multi-currency system integrates with:
- Stripe payment processing
- Order management
- Invoice generation
- Payout calculations

### Course Management

Currency settings are integrated into:
- Course creation workflow
- Course editing interface
- Pricing display
- Enrollment process

## Troubleshooting

### Common Issues

1. **Exchange Rate Not Found**
   - Ensure exchange rate exists between currency pair
   - Check if rate is active and not expired
   - Verify currency IDs are correct

2. **Currency Conversion Errors**
   - Validate currency codes are uppercase
   - Check decimal precision settings
   - Ensure rates are positive numbers

3. **Course Currency Configuration**
   - Verify base currency is active
   - Check allowed payment currencies exist
   - Validate custom exchange rates format

### Debug Mode

Enable debug logging by setting:
```javascript
process.env.CURRENCY_DEBUG = 'true';
```

## Future Enhancements

- Real-time exchange rate API integration
- Automated rate updates
- Currency-specific tax calculations
- Multi-currency reporting
- Currency hedging options
- Regional pricing strategies

## Support

For issues or questions regarding the multi-currency system:
1. Check the API documentation
2. Review the database schema
3. Test with the provided examples
4. Check the version.txt for latest changes
