// loanRequirements.js
// Structured frontend configuration for loan-specific document requirements.
// Prepared for backend integration.

export const LOAN_TYPES = [
    { id: "personal", label: "Personal Loan" },
    { id: "home", label: "Home Loan" },
    { id: "education", label: "Education Loan" },
    { id: "vehicle", label: "Vehicle Loan" },
    { id: "business", label: "Business Loan" },
    { id: "gold", label: "Gold Loan" },
    { id: "agriculture", label: "Agriculture Loan" },
    { id: "lap", label: "Loan Against Property" },
    { id: "lafd", label: "Loan Against Fixed Deposit" },
    { id: "consumer_durable", label: "Consumer Durable Loan" }
];

export const DOCUMENT_REQUIREMENTS = {
    personal: [
        { id: "aadhaar", label: "Aadhaar / Government-issued identity proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size photograph", required: true, multiple: false, category: "identity" },
        { id: "salary_slips", label: "Last 3 months salary slips", required: true, multiple: true, category: "income" },
        { id: "bank_statements", label: "Last 6 months bank statements", required: true, multiple: true, category: "financial" },
        { id: "employment_proof", label: "Employment / salary proof", required: false, multiple: false, category: "employment" }
    ],
    home: [
        { id: "aadhaar", label: "Aadhaar / Government-issued identity proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size photograph", required: true, multiple: false, category: "identity" },
        { id: "income_proof", label: "Last 3–6 months salary slips or income proof", required: true, multiple: true, category: "income" },
        { id: "bank_statements", label: "Last 6 months bank statements", required: true, multiple: true, category: "financial" },
        { id: "itr", label: "Income Tax Returns / Form 16", required: false, multiple: true, category: "tax" },
        { id: "property_docs", label: "Property documents", required: true, multiple: true, category: "property" },
        { id: "sale_agreement", label: "Sale agreement / sale deed", required: true, multiple: false, category: "property" },
        { id: "valuation", label: "Property valuation", required: false, multiple: false, category: "property" },
        { id: "address_proof", label: "Address proof", required: true, multiple: false, category: "identity" }
    ],
    education: [
        { id: "aadhaar", label: "Aadhaar / Government-issued identity proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: false, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size photograph", required: true, multiple: false, category: "identity" },
        { id: "admission_letter", label: "Admission / offer letter", required: true, multiple: false, category: "education" },
        { id: "fee_structure", label: "Course fee structure", required: true, multiple: false, category: "education" },
        { id: "marksheets", label: "Academic marksheets / certificates", required: true, multiple: true, category: "education" },
        { id: "prev_cert", label: "Previous qualification certificate", required: true, multiple: false, category: "education" },
        { id: "coapplicant_income", label: "Co-applicant / parent income proof", required: true, multiple: true, category: "income" },
        { id: "coapplicant_bank", label: "Co-applicant / parent bank statements", required: true, multiple: true, category: "financial" },
        { id: "collateral", label: "Collateral/property documents", required: false, multiple: true, category: "property" }
    ],
    vehicle: [
        { id: "aadhaar", label: "Aadhaar / Government-issued identity proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size photograph", required: true, multiple: false, category: "identity" },
        { id: "quotation", label: "Vehicle quotation / proforma invoice", required: true, multiple: false, category: "vehicle" },
        { id: "income_proof", label: "Last 3 months salary slips or income proof", required: true, multiple: true, category: "income" },
        { id: "bank_statements", label: "Last 6 months bank statements", required: true, multiple: true, category: "financial" },
        { id: "address_proof", label: "Address proof", required: true, multiple: false, category: "identity" },
        { id: "employment_proof", label: "Employment/business proof", required: false, multiple: false, category: "employment" }
    ],
    business: [
        { id: "aadhaar", label: "Aadhaar / Government-issued identity proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "incorporation", label: "Business registration / incorporation certificate", required: true, multiple: false, category: "business" },
        { id: "gst", label: "GST registration and relevant GST records", required: true, multiple: true, category: "business" },
        { id: "business_address", label: "Business address proof", required: true, multiple: false, category: "business" },
        { id: "business_bank", label: "Last 12 months business bank statements", required: true, multiple: true, category: "financial" },
        { id: "itr", label: "Income Tax Returns", required: true, multiple: true, category: "tax" },
        { id: "financial_statements", label: "Financial statements / profit and loss statement", required: true, multiple: true, category: "financial" },
        { id: "balance_sheet", label: "Balance sheet", required: false, multiple: false, category: "financial" },
        { id: "ownership", label: "Business ownership / partnership documents", required: false, multiple: true, category: "business" }
    ],
    gold: [
        { id: "aadhaar", label: "Aadhaar / Government-issued identity proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size photograph", required: true, multiple: false, category: "identity" },
        { id: "address_proof", label: "Address proof", required: true, multiple: false, category: "identity" },
        { id: "gold_details", label: "Gold / pledged asset details", required: false, multiple: true, category: "asset" }
    ],
    agriculture: [
        { id: "aadhaar", label: "Aadhaar / Government-issued identity proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: false, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size photograph", required: true, multiple: false, category: "identity" },
        { id: "land_records", label: "Land ownership / land records", required: true, multiple: true, category: "property" },
        { id: "address_proof", label: "Address proof", required: true, multiple: false, category: "identity" },
        { id: "bank_statements", label: "Bank statements", required: true, multiple: true, category: "financial" },
        { id: "crop_details", label: "Crop details / crop cultivation records", required: true, multiple: true, category: "agriculture" },
        { id: "agri_income", label: "Agricultural income supporting documents", required: false, multiple: true, category: "income" },
        { id: "agri_property", label: "Relevant agricultural/property documentation", required: false, multiple: true, category: "property" }
    ],
    lap: [
        { id: "aadhaar", label: "Aadhaar / Government-issued Identity Proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size Photograph", required: true, multiple: false, category: "identity" },
        { id: "address_proof", label: "Address Proof", required: true, multiple: false, category: "identity" },
        { id: "income_proof", label: "Income Proof", required: true, multiple: true, category: "income" },
        { id: "salary_slips", label: "Latest Salary Slips for salaried applicants", required: false, multiple: true, category: "income" },
        { id: "bank_statements", label: "Bank Statements", required: true, multiple: true, category: "financial" },
        { id: "itr", label: "Income Tax Returns / Form 16 where applicable", required: false, multiple: true, category: "tax" },
        { id: "property_ownership", label: "Property Ownership / Title Documents", required: true, multiple: true, category: "property" },
        { id: "sale_deed", label: "Sale Deed / Registered Property Documents", required: true, multiple: false, category: "property" },
        { id: "prev_title", label: "Previous Title / Chain Documents where applicable", required: false, multiple: true, category: "property" },
        { id: "property_tax", label: "Property Tax Receipts", required: true, multiple: true, category: "property" },
        { id: "building_plan", label: "Approved Building Plan / Relevant Property Approval Documents where applicable", required: false, multiple: true, category: "property" },
        { id: "property_valuation", label: "Property Valuation / Technical Assessment Documents where applicable", required: false, multiple: false, category: "property" }
    ],
    lafd: [
        { id: "aadhaar", label: "Aadhaar / Government-issued Identity Proof", required: true, multiple: false, category: "identity" },
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "photo", label: "Passport-size Photograph", required: true, multiple: false, category: "identity" },
        { id: "address_proof", label: "Address Proof where applicable", required: false, multiple: false, category: "identity" },
        { id: "fd_certificate", label: "Fixed Deposit Certificate / FD Receipt", required: true, multiple: false, category: "asset" },
        { id: "fd_details", label: "Fixed Deposit Account Details", required: true, multiple: false, category: "asset" },
        { id: "bank_details", label: "Bank Account Details", required: true, multiple: false, category: "financial" },
        { id: "bank_statements", label: "Bank Statement where applicable", required: false, multiple: true, category: "financial" },
        { id: "loan_auth", label: "Loan / Lien-related authorization or application documents where applicable", required: false, multiple: true, category: "asset" }
    ],
    consumer_durable: [
        { id: "pan", label: "PAN Card", required: true, multiple: false, category: "identity" },
        { id: "aadhaar", label: "Aadhaar / Government-issued Identity Proof", required: true, multiple: false, category: "identity" },
        { id: "bank_details", label: "Banking Details / Bank Account Information", required: true, multiple: false, category: "financial" },
        { id: "address_proof", label: "Address / KYC Information where applicable", required: false, multiple: false, category: "identity" },
        { id: "product_invoice", label: "Product Quotation / Invoice", required: true, multiple: false, category: "product" },
        { id: "purchase_details", label: "Product Purchase Details", required: true, multiple: false, category: "product" },
        { id: "income_proof", label: "Income / Eligibility Proof where required", required: false, multiple: true, category: "income" },
        { id: "salary_slip", label: "Salary Slip or Bank Statement where required by the lender", required: false, multiple: true, category: "financial" }
    ]
};
