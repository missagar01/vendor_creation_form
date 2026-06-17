import React from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  Hash,
  Globe,
  Send,
  Info,
  Database,
  Building,
  CreditCard
} from "lucide-react";
import "./styles.css";

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[0-9]{10}$/;
const PIN_PATTERN = /^[0-9]{6}$/;

const CHECKSUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

function isValidChecksum(gstin) {
  if (gstin.length !== 15) return false;
  const chars = gstin.slice(0, 14).split("");
  let factor = 2;
  let sum = 0;

  for (let i = chars.length - 1; i >= 0; i -= 1) {
    const codePoint = CHECKSUM_CHARS.indexOf(chars[i]);
    if (codePoint === -1) return false;
    const digit = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    sum += Math.floor(digit / 36) + (digit % 36);
  }

  const checkCodePoint = (36 - (sum % 36)) % 36;
  return CHECKSUM_CHARS[checkCodePoint] === gstin[14];
}

function App() {
  const [formData, setFormData] = React.useState({
    vendorName: "",
    gstNumber: "",
    panNumber: "",
    address: "",
    cityName: "",
    stateName: "",
    stateCode: "",
    pinCode: "",
    mobileNumber: "",
    contactPerson: "",
    emailId: "",
  });

  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  // Retrieve sheets URL from environment variable
  const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || "";

  // Auto-fill values from GSTIN
  React.useEffect(() => {
    const cleanGst = formData.gstNumber.trim().toUpperCase();
    if (cleanGst.length >= 2) {
      const code = cleanGst.slice(0, 2);
      const matchedState = STATE_CODES[code];
      if (matchedState) {
        setFormData((prev) => ({
          ...prev,
          stateCode: code,
          stateName: matchedState,
        }));
      }
    }

    if (cleanGst.length >= 12) {
      const extractedPan = cleanGst.slice(2, 12);
      if (PAN_PATTERN.test(extractedPan)) {
        setFormData((prev) => ({
          ...prev,
          panNumber: extractedPan,
        }));
      }
    }
  }, [formData.gstNumber]);

  const validateField = (name, value) => {
    let error = "";
    const cleanVal = (value || "").trim();

    if (!cleanVal) {
      return "This field is required";
    }

    switch (name) {
      case "gstNumber":
        const uppercaseGst = cleanVal.toUpperCase();
        if (!GSTIN_PATTERN.test(uppercaseGst)) {
          error = "Invalid GSTIN format (e.g., 27AAECS1234F1ZO)";
        } else if (!isValidChecksum(uppercaseGst)) {
          error = "Invalid GSTIN checksum";
        }
        break;
      case "panNumber":
        if (!PAN_PATTERN.test(cleanVal.toUpperCase())) {
          error = "Invalid PAN format (e.g., ABCDE1234F)";
        }
        break;
      case "pinCode":
        if (!PIN_PATTERN.test(cleanVal)) {
          error = "Must be exactly 6 digits";
        }
        break;
      case "mobileNumber":
        if (!MOBILE_PATTERN.test(cleanVal)) {
          error = "Must be exactly 10 digits";
        }
        break;
      case "emailId":
        if (!EMAIL_PATTERN.test(cleanVal)) {
          error = "Invalid email format";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Formatting constraints
    let formattedValue = value;
    if (name === "gstNumber" || name === "panNumber") {
      formattedValue = value.replace(/\s+/g, "").toUpperCase();
    } else if (name === "mobileNumber" || name === "pinCode" || name === "stateCode") {
      formattedValue = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    // Real-time error clearance
    if (touched[name]) {
      const error = validateField(name, formattedValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(formData).reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
    );

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      setSubmitError("Please fill all fields correctly.");
      return;
    }

    if (!sheetUrl) {
      setSubmitError("Google Sheet connection URL is missing in the environment configuration (.env).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(sheetUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setSubmitSuccess(true);
      setFormData({
        vendorName: "",
        gstNumber: "",
        panNumber: "",
        address: "",
        cityName: "",
        stateName: "",
        stateCode: "",
        pinCode: "",
        mobileNumber: "",
        contactPerson: "",
        emailId: "",
      });
      setTouched({});
      setErrors({});
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to submit form. Please check your network and .env configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="header-container">
          <div className="brand-mark">
            {/* Sagar TMT & Pipes Corporate Logo */}
            <div className="logo-wrapper">
              <img 
                src="/logo.png" 
                alt="Sagar TMT & Pipes" 
                className="brand-logo-img" 
                onError={(e) => { 
                  e.target.style.display = 'none';
                  const fb = document.getElementById('brand-text-fallback');
                  if (fb) fb.style.display = 'flex';
                }} 
              />
              <div id="brand-text-fallback" className="brand-text-fallback" style={{ display: 'none' }}>
                <span className="fallback-title">SAGAR</span>
                <span className="fallback-subtitle">TMT & PIPES</span>
              </div>
            </div>
            <h1 className="header-brand-title">SAGAR TMT AND PIPES</h1>
          </div>
        </div>
      </header>

      <div className="form-container">
        <div className="intro-block">
          <h2>Register as a Trusted Partner</h2>
        </div>

        {submitSuccess && (
          <div className="banner success-banner">
            <CheckCircle2 size={24} />
            <div>
              <h4>Registration Submitted Successfully!</h4>
              <p>Your details have been successfully recorded.</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="banner error-banner">
            <AlertCircle size={24} />
            <div>
              <h4>Submission Error</h4>
              <p>{submitError}</p>
            </div>
          </div>
        )}

        {!submitSuccess && (
          <form onSubmit={handleSubmit} className="registration-form" noValidate>
          {/* Section 1: Business Identity */}
          <div className="form-section">
            <div className="section-title">
              <Building2 size={20} />
              <h2>1. Business Identity</h2>
            </div>
            <div className="section-grid cols-2">
              <div className="input-field-wrapper">
                <label htmlFor="vendorName">Vendor Legal Name *</label>
                <div className="input-control">
                  <User className="input-icon" size={18} />
                  <input
                    id="vendorName"
                    name="vendorName"
                    type="text"
                    value={formData.vendorName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="E.g. Acme Corporation Pvt Ltd"
                    className={touched.vendorName && errors.vendorName ? "error" : ""}
                  />
                </div>
                {touched.vendorName && errors.vendorName && (
                  <span className="error-text">{errors.vendorName}</span>
                )}
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="gstNumber">GSTIN (GST Number) *</label>
                <div className="input-control">
                  <Hash className="input-icon" size={18} />
                  <input
                    id="gstNumber"
                    name="gstNumber"
                    type="text"
                    maxLength={15}
                    value={formData.gstNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="15-character GSTIN"
                    className={touched.gstNumber && errors.gstNumber ? "error" : ""}
                  />
                </div>
                {touched.gstNumber && errors.gstNumber ? (
                  <span className="error-text">{errors.gstNumber}</span>
                ) : (
                  formData.gstNumber.length === 15 && !errors.gstNumber && (
                    <span className="success-hint">
                      ✓ Valid format for {formData.stateName || "State"}
                    </span>
                  )
                )}
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="panNumber">PAN Number *</label>
                <div className="input-control">
                  <CreditCard className="input-icon" size={18} />
                  <input
                    id="panNumber"
                    name="panNumber"
                    type="text"
                    maxLength={10}
                    value={formData.panNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="10-character PAN"
                    className={touched.panNumber && errors.panNumber ? "error" : ""}
                  />
                </div>
                {touched.panNumber && errors.panNumber && (
                  <span className="error-text">{errors.panNumber}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Address & Location */}
          <div className="form-section">
            <div className="section-title">
              <MapPin size={20} />
              <h2>2. Address & Location</h2>
            </div>
            <div className="input-field-wrapper full-width">
              <label htmlFor="address">Registered Office Address *</label>
              <div className="input-control">
                <MapPin className="input-icon" size={18} />
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Street name, industrial zone, unit number"
                  className={touched.address && errors.address ? "error" : ""}
                />
              </div>
              {touched.address && errors.address && (
                <span className="error-text">{errors.address}</span>
              )}
            </div>

            <div className="section-grid cols-3">
              <div className="input-field-wrapper">
                <label htmlFor="cityName">City Name *</label>
                <div className="input-control">
                  <Building className="input-icon" size={18} />
                  <input
                    id="cityName"
                    name="cityName"
                    type="text"
                    value={formData.cityName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="E.g. Mumbai"
                    className={touched.cityName && errors.cityName ? "error" : ""}
                  />
                </div>
                {touched.cityName && errors.cityName && (
                  <span className="error-text">{errors.cityName}</span>
                )}
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="stateName">State Name *</label>
                <div className="input-control">
                  <Globe className="input-icon" size={18} />
                  <input
                    id="stateName"
                    name="stateName"
                    type="text"
                    value={formData.stateName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="E.g. Maharashtra"
                    className={touched.stateName && errors.stateName ? "error" : ""}
                  />
                </div>
                {touched.stateName && errors.stateName && (
                  <span className="error-text">{errors.stateName}</span>
                )}
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="stateCode">State Code *</label>
                <div className="input-control">
                  <Hash className="input-icon" size={18} />
                  <input
                    id="stateCode"
                    name="stateCode"
                    type="text"
                    maxLength={2}
                    value={formData.stateCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="E.g. 27"
                    className={touched.stateCode && errors.stateCode ? "error" : ""}
                  />
                </div>
                {touched.stateCode && errors.stateCode && (
                  <span className="error-text">{errors.stateCode}</span>
                )}
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="pinCode">Pin Code *</label>
                <div className="input-control">
                  <Hash className="input-icon" size={18} />
                  <input
                    id="pinCode"
                    name="pinCode"
                    type="text"
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="6-digit postal code"
                    className={touched.pinCode && errors.pinCode ? "error" : ""}
                  />
                </div>
                {touched.pinCode && errors.pinCode && (
                  <span className="error-text">{errors.pinCode}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Contact Representatives */}
          <div className="form-section">
            <div className="section-title">
              <User size={20} />
              <h2>3. Contact Information</h2>
            </div>
            <div className="section-grid cols-3">
              <div className="input-field-wrapper">
                <label htmlFor="contactPerson">Contact Person *</label>
                <div className="input-control">
                  <User className="input-icon" size={18} />
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Full name of representative"
                    className={touched.contactPerson && errors.contactPerson ? "error" : ""}
                  />
                </div>
                {touched.contactPerson && errors.contactPerson && (
                  <span className="error-text">{errors.contactPerson}</span>
                )}
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="mobileNumber">Mobile Number *</label>
                <div className="input-control">
                  <Phone className="input-icon" size={18} />
                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="text"
                    maxLength={10}
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="10-digit number"
                    className={touched.mobileNumber && errors.mobileNumber ? "error" : ""}
                  />
                </div>
                {touched.mobileNumber && errors.mobileNumber && (
                  <span className="error-text">{errors.mobileNumber}</span>
                )}
              </div>

              <div className="input-field-wrapper">
                <label htmlFor="emailId">Email ID *</label>
                <div className="input-control">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="emailId"
                    name="emailId"
                    type="email"
                    value={formData.emailId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="partner@domain.com"
                    className={touched.emailId && errors.emailId ? "error" : ""}
                  />
                </div>
                {touched.emailId && errors.emailId && (
                  <span className="error-text">{errors.emailId}</span>
                )}
              </div>
            </div>
          </div>

          <div className="submit-panel">
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-button submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spin" size={20} />
                  Submitting Registration...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Registration
                </>
              )}
            </button>
          </div>
          </form>
        )}
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
