import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { itemsApi } from '../api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { CATEGORIES, AREAS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

const STEP_TITLES = [
  'Photos',
  'Item Details',
  'Pricing & Terms',
  'Availability',
  'Handover & Location',
  'Review & Publish'
];

/**
 * Downscale image via HTML5 Canvas before sending as base64 data URL
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function ListItemPage() {
  const { user, requireAuth, showToast } = useApp();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [mlPricing, setMlPricing] = useState(null);
  const [loadingMlPrice, setLoadingMlPrice] = useState(false);

  const [formData, setFormData] = useState({
    images: [],
    coverIndex: 0,
    title: '',
    category: '',
    brand: '',
    condition: 'Good',
    description: '',
    price: '',
    deposit: '',
    minDays: 1,
    maxDays: 14,
    area: user?.area in AREAS ? user.area : 'Adyar',
    delivery: false,
    meetingDetails: ''
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-white p-12 text-center my-8">
        <span className="text-4xl mb-3">🔒</span>
        <h2 className="text-xl font-bold text-[#232826]">Please Log In to List an Item</h2>
        <p className="mt-1 text-xs text-mute max-w-sm">
          You need an active Borrowly account to list items, accept rental requests, and communicate with borrowers.
        </p>
        <Button onClick={requireAuth} className="mt-4">
          Log In or Sign Up
        </Button>
      </div>
    );
  }

  const handleFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const updatedImages = [...formData.images];
    setErrorMsg('');

    for (let i = 0; i < files.length; i++) {
      if (updatedImages.length >= 8) {
        setErrorMsg('Maximum 8 photos allowed');
        break;
      }
      setUploadProgress(`Optimizing photo ${i + 1} of ${files.length}...`);
      try {
        const compressed = await compressImage(files[i]);
        updatedImages.push(compressed);
      } catch {
        setErrorMsg(`${files[i].name} could not be processed as an image`);
      }
    }

    setUploadProgress('');
    setFormData((prev) => ({ ...prev, images: updatedImages }));
    e.target.value = '';
  };

  const removePhoto = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
      coverIndex: 0
    }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 1 && formData.images.length === 0) {
      return 'Please upload at least one clear photo of your item';
    }
    if (currentStep === 2) {
      if (!formData.title.trim()) return 'Item title is required';
      if (!formData.category) return 'Please choose a category';
      if (formData.description.trim().length < 20) {
        return 'Please provide a description with at least 20 characters';
      }
    }
    if (currentStep === 3) {
      if (!(Number(formData.price) > 0)) return 'Please set a daily rental price above ₹0';
      if (Number(formData.minDays) > Number(formData.maxDays)) {
        return 'Minimum rental days cannot exceed maximum days';
      }
    }
    return '';
  };

  const handleFetchPriceSuggestion = async (cat, brand, cond, area, title) => {
    try {
      setLoadingMlPrice(true);
      const [lat, lng] = AREAS[area || formData.area] || AREAS.Adyar;
      const res = await itemsApi.predictPrice({
        title: title || formData.title,
        category: cat || formData.category,
        brand: brand || formData.brand || 'Generic',
        condition: cond || formData.condition || 'Good',
        area: area || formData.area || 'Adyar',
        lat,
        lng
      });
      if (res && res.suggested_price) {
        setMlPricing(res);
        setFormData((prev) => ({ ...prev, price: String(res.suggested_price) }));
      }
    } catch {
      // Ignore background ML fetch failure
    } finally {
      setLoadingMlPrice(false);
    }
  };

  const handleNextStep = async () => {
    const error = validateCurrentStep();
    if (error) {
      setErrorMsg(error);
      return;
    }
    setErrorMsg('');

    if (currentStep < 6) {
      if (currentStep === 2) {
        // Recalculate price dynamically with latest title, category, brand, and condition
        handleFetchPriceSuggestion(formData.category, formData.brand, formData.condition, formData.area, formData.title);
      }
      setCurrentStep((step) => step + 1);
      return;
    }

    // Final step: Publish item
    setSubmitting(true);
    try {
      const [lat, lng] = AREAS[formData.area] || AREAS.Adyar;
      const reorderedImages = [
        formData.images[formData.coverIndex],
        ...formData.images.filter((_, idx) => idx !== formData.coverIndex)
      ];

      const res = await itemsApi.createItem({
        ...formData,
        images: reorderedImages,
        lat,
        lng,
        price: Number(formData.price),
        deposit: Number(formData.deposit) || 0,
        minDays: Number(formData.minDays),
        maxDays: Number(formData.maxDays)
      });

      showToast('Your item is now live and bookable!');
      navigate(`/item/${res.id}`);
    } catch (err) {
      setErrorMsg(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto my-8 max-w-2xl py-4">
      {/* Step Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-[#232826] tracking-tight">List an Item for Rent</h1>
        <p className="text-xs text-mute mt-1">
          Share unused gear with neighbours and earn money safely.
        </p>

        {/* Progress bar */}
        <div className="mt-4 flex gap-2">
          {STEP_TITLES.map((title, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-colors ${
                idx + 1 <= currentStep ? 'bg-forest' : 'bg-stone-200'
              }`}
              title={`Step ${idx + 1}: ${title}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs font-bold text-forest">
          Step {currentStep} of 6: {STEP_TITLES[currentStep - 1]}
        </p>
      </div>

      {/* Step Content Container */}
      <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-sm">
        {/* Step 1: Photos */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#232826]">Upload Item Photos</h2>
              <p className="text-xs text-mute mt-1">
                Add up to 8 real photos of the item. Click any thumbnail to set it as the cover photo.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line p-6 text-center hover:border-forest/50 hover:bg-stone-50 cursor-pointer transition-colors">
              <span className="text-3xl mb-2">📸</span>
              <span className="text-xs font-bold text-forest">Choose Photos from Device</span>
              <span className="text-[11px] text-mute mt-1">JPEG, PNG or WEBP up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadProgress && (
              <p className="text-xs font-medium text-forest animate-pulse">{uploadProgress}</p>
            )}

            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 pt-2">
                {formData.images.map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden border">
                    <img
                      src={imgUrl}
                      alt=""
                      onClick={() => setFormData((prev) => ({ ...prev, coverIndex: idx }))}
                      className={`h-full w-full object-cover cursor-pointer ${
                        idx === formData.coverIndex
                          ? 'ring-4 ring-forest ring-inset'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                    {idx === formData.coverIndex && (
                      <span className="absolute left-1 top-1 rounded bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Cover
                      </span>
                    )}
                    <button
                      onClick={() => removePhoto(idx)}
                      aria-label="Remove photo"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white hover:bg-black"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Item Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Input
              id="item-title"
              label="Item Title"
              placeholder="e.g. Sony Alpha A7 III Camera with 28-70mm Lens"
              required
              value={formData.title}
              onChange={handleFieldChange('title')}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-cat" className="text-xs font-semibold uppercase tracking-wider text-mute">
                Category *
              </label>
              <select
                id="item-cat"
                value={formData.category}
                onChange={handleFieldChange('category')}
                className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[#232826] focus:border-forest focus:outline-none"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map(([name]) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="item-brand"
                label="Brand"
                placeholder="e.g. Sony, Bosch, Quechua"
                value={formData.brand}
                onChange={handleFieldChange('brand')}
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="item-cond" className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Condition
                </label>
                <select
                  id="item-cond"
                  value={formData.condition}
                  onChange={handleFieldChange('condition')}
                  className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[#232826] focus:border-forest focus:outline-none"
                >
                  <option value="Like new">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-desc" className="text-xs font-semibold uppercase tracking-wider text-mute">
                Description *
              </label>
              <textarea
                id="item-desc"
                rows={4}
                required
                placeholder="Include specifications, accessories included, and helpful usage instructions for borrowers..."
                value={formData.description}
                onChange={handleFieldChange('description')}
                className="rounded-xl border border-line bg-white p-3 text-sm text-[#232826] focus:border-forest focus:outline-none"
              />
              <span className="text-[11px] text-mute">Min 20 characters</span>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* ML AI Price Suggestion Card */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-forest/5 to-teal-50 p-4 border border-emerald-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-forest text-white text-xs shrink-0 shadow-sm">
                    🤖
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-forest uppercase tracking-wide">
                        ML Price Recommendation Model
                      </h4>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        HistGradientBoosting Quantile Regressor
                      </span>
                    </div>
                    {loadingMlPrice ? (
                      <p className="mt-1 text-xs text-mute animate-pulse">Calculating optimal rental price using market signals...</p>
                    ) : mlPricing ? (
                      <div className="mt-1 text-xs text-stone-700">
                        <span>Suggested: </span>
                        <span className="text-base font-black text-forest">₹{mlPricing.suggested_price}</span>
                        <span className="text-mute font-medium"> / day</span>
                        <span className="mx-2 text-stone-300">·</span>
                        <span className="text-mute">
                          Recommended range: <b>₹{mlPricing.price_low} – ₹{mlPricing.price_high}</b>
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-mute">
                        Click below to estimate fair market pricing based on category demand, condition, and local area data.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {mlPricing && (
                    <Button
                      type="button"
                      variant="lime"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, price: String(mlPricing.suggested_price) }))}
                    >
                      Use ₹{mlPricing.suggested_price}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={loadingMlPrice}
                    onClick={() => handleFetchPriceSuggestion(formData.category, formData.brand, formData.condition, formData.area, formData.title)}
                  >
                    {mlPricing ? 'Recalculate' : '✨ Get AI Price'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="item-price"
                type="number"
                min="1"
                label="Daily Rental Rate (₹)"
                placeholder="e.g. 250"
                required
                value={formData.price}
                onChange={handleFieldChange('price')}
              />

              <Input
                id="item-deposit"
                type="number"
                min="0"
                label="Refundable Deposit (₹)"
                placeholder="e.g. 1000"
                value={formData.deposit}
                onChange={handleFieldChange('deposit')}
                helperText="Returned to borrower on safe return"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="item-mindays"
                type="number"
                min="1"
                label="Min Rental Days"
                value={formData.minDays}
                onChange={handleFieldChange('minDays')}
              />

              <Input
                id="item-maxdays"
                type="number"
                min="1"
                label="Max Rental Days"
                value={formData.maxDays}
                onChange={handleFieldChange('maxDays')}
              />
            </div>
          </div>
        )}

        {/* Step 4: Availability rules */}
        {currentStep === 4 && (
          <div className="space-y-4 text-xs text-[#232826] leading-relaxed">
            <h2 className="text-base font-bold text-[#232826]">Automated Calendar Scheduling</h2>
            <p>
              Your listing is automatically available on any day not reserved by an approved booking.
              Whenever you approve a request, those dates are instantly locked across the microservices
              to prevent double-booking.
            </p>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
              <b>✓ Smart Concurrency Locking:</b> Our Redis-backed transactional lock prevents
              overlapping borrows even if multiple neighbours submit requests simultaneously.
            </div>
          </div>
        )}

        {/* Step 5: Handover & Location */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-area" className="text-xs font-semibold uppercase tracking-wider text-mute">
                Pickup Neighbourhood
              </label>
              <select
                id="item-area"
                value={formData.area}
                onChange={handleFieldChange('area')}
                className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-[#232826] focus:border-forest focus:outline-none"
              >
                {Object.keys(AREAS).map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#232826]">
              <input
                type="checkbox"
                checked={formData.delivery}
                onChange={handleFieldChange('delivery')}
                className="rounded text-forest focus:ring-forest"
              />
              <span>I can deliver this item to nearby borrowers</span>
            </label>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-meeting" className="text-xs font-semibold uppercase tracking-wider text-mute">
                Private Handover Note (Shared only after you approve a request)
              </label>
              <textarea
                id="item-meeting"
                rows={3}
                placeholder="e.g. Meet in the clubhouse lobby at 1st Main Rd; flat number will be shared in chat."
                value={formData.meetingDetails}
                onChange={handleFieldChange('meetingDetails')}
                className="rounded-xl border border-line bg-white p-3 text-sm text-[#232826] focus:border-forest focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 6: Review & Publish Preview */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#232826]">Listing Preview</h2>
            <div className="max-w-xs overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              {formData.images[formData.coverIndex] && (
                <img
                  src={formData.images[formData.coverIndex]}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="p-4">
                <span className="text-[10px] font-bold text-forest uppercase">{formData.category}</span>
                <h3 className="text-base font-bold text-[#232826]">{formData.title}</h3>
                <p className="mt-1 font-extrabold text-[#232826]">
                  {formatCurrency(formData.price)}/day
                  {formData.deposit ? ` · ${formatCurrency(formData.deposit)} deposit` : ''}
                </p>
                <p className="text-xs text-mute mt-1">📍 {formData.area}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Form Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setErrorMsg('');
                setCurrentStep((s) => s - 1);
              }}
            >
              ← Back
            </Button>
          ) : (
            <div />
          )}

          <Button onClick={handleNextStep} loading={submitting}>
            {currentStep === 6 ? 'Publish Listing' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
