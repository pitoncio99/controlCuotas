# **App Name**: CuotaControl

## Core Features:

- Person Management: Maintain a list of people to whom purchases can be assigned. Data stored in a separate Firestore collection.
- Card Management: Maintain a list of credit cards to be assigned to each purchase, including a color for each card. Data stored in a separate Firestore collection.
- Purchase Grouping: Group purchases into installments, recording details like card (FK), person (FK), installment amount, paid installments, total installments, payment deadline, etc. Calculates the outstanding amounts. Central data entity in Firestore.
- Automatic Percentage Calculation: Automatically calculates payment percentages to reflect how far along a specific payment is. Basic arithmetic calculations.
- Summary Dashboard: Provide a summary view with an overview of spending. Aggregates data from purchases, expenses, and income.
- Expense Tracker: Record additional card expenses, providing an exact ledger of money leaving the bank. Stored as individual elements in Firestore.
- Budget Planner: Enables entry of monthly income to provide daily, weekly, and monthly spending insights. Basic arithmetic calculations.
- Basic Monitoring: Provides basic monitoring of CPU usage, available memory, and the number of requests made to the app. Leverages Firebase monitoring tools.

## Style Guidelines:

- Primary color: #3366BB (HSL: 220, 40%, 47%) – A calm and trustworthy blue to evoke financial security.
- Background color: #E6EBF5 (HSL: 220, 30%, 91%) – Light, desaturated blue for a clean, unobtrusive background.
- Accent color: #BB3366 (HSL: 330, 40%, 47%) – A contrasting pinkish hue, for highlighting actions and important information.
- Body: 'PT Sans', a humanist sans-serif.
- Headlines: 'Space Grotesk', a sans-serif with a modern, digital feel.
- Use minimalist, line-based icons for clarity and a modern feel.
- Ensure a clean, tabular layout for data-heavy sections, following the model in the user's original request. Responsive design for web platform.