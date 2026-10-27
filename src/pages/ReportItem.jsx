import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  Tag,
  FileText,
  Search,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Electronics',
  'ID Cards & Wallets',
  'Books & Notebooks',
  'Bags & Backpacks',
  'Clothing & Apparel',
  'Keys',
  'Accessories',
  'Other'
];

const COMMON_CAMPUS_LOCATIONS = [
  'Main Campus Library',
  'Student Center & Cafeteria',
  'Science Complex / Labs',
  'Engineering & Tech Building',
  'Sports Complex & Gym',
  'Lecture Hall Complex',
  'Administrative Quad',
  'Campus Parking Lots'
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ReportItem() {
  const { user } = useAuth();

  // Form State
  const [type, setType] = useState('lost'); // 'lost' | 'found'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateIncident, setDateIncident] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  
  // File & Preview State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Status & Validation State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successItem, setSuccessItem] = useState(null);

  // Today's date string for input max limit
  const todayStr = new Date().toISOString().split('T')[0];

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle Photo Selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous photo error
    setErrors((prev) => ({ ...prev, photo: null }));

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Invalid format. Please upload a JPEG, PNG, or WebP photograph.'
      }));
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors((prev) => ({
        ...prev,
        photo: `File size exceeds 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a smaller photo.`
      }));
      return;
    }

    // Free existing preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Remove Selected Photo
  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrors((prev) => ({ ...prev, photo: null }));
  };

  // Validate entire form before submission
  const validateForm = () => {
    const errs = {};

    if (!title.trim()) {
      errs.title = 'Item title is required.';
    } else if (title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    } else if (title.trim().length > 100) {
      errs.title = 'Title cannot exceed 100 characters.';
    }

    if (!category) {
      errs.category = 'Please select a category.';
    }

    if (!location.trim()) {
      errs.location = 'Campus location is required.';
    } else if (location.trim().length < 2) {
      errs.location = 'Location description is too short.';
    } else if (location.trim().length > 100) {
      errs.location = 'Location cannot exceed 100 characters.';
    }

    if (!dateIncident) {
      errs.date_incident = 'Incident date is required.';
    } else if (dateIncident > todayStr) {
      errs.date_incident = 'Incident date cannot be in the future.';
    }

    if (!description.trim()) {
      errs.description = 'Item description is required.';
    } else if (description.trim().length < 10) {
      errs.description = 'Please provide a more descriptive summary (at least 10 characters).';
    } else if (description.trim().length > 1000) {
      errs.description = 'Description cannot exceed 1000 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setErrors({ general: 'You must be signed in to submit an item report.' });
      return;
    }

    setIsSubmitting(true);
    let uploadedPhotoPath = null;

    try {
      // Step 1: Upload photo to private item-photos bucket if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const sanitizedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpg';
        const uniqueSuffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
        const storagePath = `${user.id}/${uniqueSuffix}.${sanitizedExt}`;

        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(storagePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('[FindIt Storage Error]:', uploadError);
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error(
              "Storage bucket 'item-photos' not found. Please create a private bucket named 'item-photos' in your Supabase Dashboard."
            );
          } else if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
            throw new Error(
              "Storage permission denied. Ensure the storage policy in 'supabase/migrations/001_initial_schema.sql' has been applied."
            );
          } else {
            throw new Error(`Photo upload failed: ${uploadError.message}`);
          }
        }

        uploadedPhotoPath = storagePath;
      }

      // Step 2: Insert item into public.items table
      const { data, error: insertError } = await supabase
        .from('items')
        .insert([
          {
            user_id: user.id,
            type,
            title: title.trim(),
            category,
            description: description.trim(),
            location: location.trim(),
            date_incident: dateIncident,
            photo_path: uploadedPhotoPath,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('[FindIt Insert Error]:', insertError);
        // Step 2b: Remove uploaded photo if DB insert failed (avoid orphaned storage files)
        if (uploadedPhotoPath) {
          try {
            await supabase.storage.from('item-photos').remove([uploadedPhotoPath]);
          } catch (cleanupErr) {
            console.warn('[FindIt] Failed to cleanup orphaned file:', cleanupErr);
          }
        }
        throw new Error(insertError.message || 'Failed to save item report to database.');
      }

      // Submission Succeeded
      setSuccessItem(data);
      setIsSubmitting(false);

    } catch (err) {
      console.error('[FindIt Report Error]:', err);
      setErrors({
        general: err.message || 'An unexpected error occurred while saving your report.'
      });
      setIsSubmitting(false);
    }
  };

  // Reset Form for another report
  const handleResetForm = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setLocation('');
    setDateIncident(new Date().toISOString().split('T')[0]);
    handleRemovePhoto();
    setErrors({});
    setSuccessItem(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Report an Item
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Provide detailed information to help reunite items with their rightful campus owners.
        </p>
      </div>

      {/* Success State View */}
      {successItem ? (
        <div className="bg-white dark:bg-[#151724] rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm p-8 sm:p-10 space-y-6 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/60 shadow-sm">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>

          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
              Report Submitted Successfully
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {successItem.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Your {successItem.type} item report is now active in the campus directory.
            </p>
          </div>

          {/* Report Summary Card */}
          <div className="bg-slate-50 dark:bg-[#11121d] rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Type</span>
                <p className="font-semibold capitalize text-slate-800 dark:text-slate-200 mt-0.5">
                  {successItem.type} Item
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Category</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {successItem.category}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Campus Location</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {successItem.location}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Date of Incident</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {successItem.date_incident}
                </p>
              </div>
            </div>

            {successItem.photo_path && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Photograph stored securely in private campus storage
              </div>
            )}
          </div>

          {/* Post-submission Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleResetForm}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1a1c2b] hover:bg-slate-50 dark:hover:bg-[#202235] border border-slate-300 dark:border-slate-800 shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Report Another Item
            </button>
            <Link
              to="/browse"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm transition-all"
            >
              <Search className="w-4 h-4" />
              Browse Campus Feed
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      ) : (
        /* Report Form */
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#151724] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-8 transition-colors duration-200">
          
          {/* General Error Banner */}
          {errors.general && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-medium leading-relaxed">
                {errors.general}
              </div>
            </div>
          )}

          {/* 1. Report Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Report Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border flex items-center justify-center gap-2 ${
                  type === 'lost'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#11121d] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a1c2b]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                I Lost Something
              </button>

              <button
                type="button"
                onClick={() => setType('found')}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border flex items-center justify-center gap-2 ${
                  type === 'found'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#11121d] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a1c2b]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                I Found Something
              </button>
            </div>
          </div>

          {/* 2. Title & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Navy Blue Hydroflask, Apple AirPods Pro"
                  maxLength={100}
                  className={`w-full py-2.5 px-3.5 bg-slate-50 dark:bg-[#11121d] border rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#161826] transition-all ${
                    errors.title
                      ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-600'
                  }`}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.title ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{errors.title}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Brief, descriptive name</p>
                )}
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{title.length}/100</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full py-2.5 px-3.5 bg-slate-50 dark:bg-[#11121d] border rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#161826] transition-all appearance-none cursor-pointer ${
                    errors.category
                      ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-600'
                  }`}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 dark:text-slate-500">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              {errors.category && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* 3. Campus Location & Incident Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Campus Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  list="campus-locations"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Library 2nd Floor"
                  maxLength={100}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#11121d] border rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#161826] transition-all ${
                    errors.location
                      ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-600'
                  }`}
                />
                <datalist id="campus-locations">
                  {COMMON_CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
              {errors.location ? (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.location}</p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Building name, floor, or campus zone</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Date Incident Occurred <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={dateIncident}
                  max={todayStr}
                  onChange={(e) => setDateIncident(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#11121d] border rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#161826] transition-all ${
                    errors.date_incident
                      ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-600'
                  }`}
                />
              </div>
              {errors.date_incident && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.date_incident}</p>
              )}
            </div>
          </div>

          {/* 4. Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{description.length}/1000</span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe distinguishing features, brand, color, stickers, scratches, or contents without revealing secret verification details (such as wallet contents or device passwords)..."
              maxLength={1000}
              className={`w-full py-2.5 px-3.5 bg-slate-50 dark:bg-[#11121d] border rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#161826] transition-all ${
                errors.description
                  ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-purple-500/20 focus:border-purple-600'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.description}</p>
            )}
          </div>

          {/* 5. Optional Photograph Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Item Photograph <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-[#11121d] max-w-sm">
                <img
                  src={previewUrl}
                  alt="Item Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-sm"
                  title="Remove photograph"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-3 bg-white dark:bg-[#151724] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                  <span className="font-mono text-slate-400 dark:text-slate-500">
                    {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600/70 bg-slate-50/50 dark:bg-[#11121d]/50 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-purple-100 dark:border-purple-900/40">
                  <Upload className="w-5 h-5 stroke-[2.2]" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Click to upload item photograph
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Supports JPEG, PNG, or WebP up to 5 MB
                </p>
              </label>
            )}

            {errors.photo && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">{errors.photo}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-md shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Submit {type === 'lost' ? 'Lost' : 'Found'} Report
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
