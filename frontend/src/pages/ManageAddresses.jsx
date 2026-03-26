import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Plus, MapPin, Trash2, Edit, Compass, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ManageAddresses() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        setAddresses(doc.data()?.addresses || []);
      });
      return () => unsub();
    }
  }, [user]);

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentAddress({ name: '', phone: '', pincode: '', address: '', city: '', state: '' });
    setShowForm(true);
  };

  const handleEdit = (address) => {
    setIsEditing(true);
    setCurrentAddress(address);
    setShowForm(true);
  };

  const handleDelete = async (addressToDelete) => {
    if (window.confirm(t('addresses.confirm_delete'))) {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressToDelete.id);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { addresses: updatedAddresses });
    }
  };

  const handleSave = async (addressToSave) => {
    let updatedAddresses;
    if (isEditing) {
      updatedAddresses = addresses.map(addr => addr.id === addressToSave.id ? addressToSave : addr);
    } else {
      updatedAddresses = [...addresses, { ...addressToSave, id: Date.now().toString() }];
    }
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { addresses: updatedAddresses });
    setShowForm(false);
  };

  return (
    <div className="bg-[#f1f3f6] dark:bg-slate-950 min-h-screen">
      <div className="bg-white dark:bg-slate-900 shadow-sm mb-8 sticky top-0 z-40">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          <Link to="/profile" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft size={16} />
            {t('addresses.back')}
          </Link>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{t('addresses.title')}</h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pb-20">
        {!showForm && (
          <button 
            onClick={handleAddNew} 
            className="w-full bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-white/10 rounded-sm flex items-center gap-4 text-primary font-black uppercase tracking-widest text-xs hover:shadow-sm transition-all mb-6"
          >
            <Plus size={20} />
            {t('addresses.btn_add')}
          </button>
        )}

        {showForm ? (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-sm shadow-sm border border-slate-200 dark:border-white/10">
            <AddressForm 
              address={currentAddress} 
              onSave={handleSave} 
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <AddressList 
            addresses={addresses} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

function AddressList({ addresses, onEdit, onDelete, t }) {
  return (
    <div className="space-y-4">
      {addresses.length > 0 ? (
        addresses.map(address => (
          <div key={address.id} className="bg-white dark:bg-slate-900 p-6 rounded-sm border border-slate-200 dark:border-white/10 shadow-sm relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest">{address.type || 'Home'}</span>
                <p className="font-black text-slate-900 dark:text-white">{address.name}</p>
                <p className="font-black text-slate-900 dark:text-white ml-4">{address.phone}</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(address)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => onDelete(address)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>{address.address}</p>
              <p>{address.city}, {address.state} - <span className="font-bold text-slate-900 dark:text-white">{address.pincode}</span></p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-white/10">
          <MapPin className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('addresses.no_addresses')}</h3>
        </div>
      )}
    </div>
  );
}

function AddressForm({ address, onSave, onCancel }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(address);
  const [isLocating, setIsLocating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
      const data = await response.json();
      if (data && data.address) {
        setFormData(prev => ({
          ...prev,
          pincode: data.address.postcode || '',
          address: `${data.address.road || ''}, ${data.address.suburb || ''}`,
          city: data.address.city || data.address.town || '',
          state: data.address.state || '',
        }));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Could not fetch your location.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em]">
          {address.id ? t('addresses.edit_title') : t('addresses.add_title')}
        </h2>
        <button type="button" onClick={handleUseLocation} disabled={isLocating} className="flex items-center gap-2 text-[10px] font-black text-primary hover:underline disabled:opacity-50 uppercase tracking-widest">
          <Compass size={14} className={isLocating ? 'animate-spin' : ''} />
          {isLocating ? t('addresses.locating') : t('addresses.btn_location')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addresses.label_name')}</label>
          <input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. John Doe" required className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm px-4 focus:ring-1 focus:ring-primary outline-none text-sm font-bold" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addresses.label_phone')}</label>
          <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="10-digit mobile number" required className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm px-4 focus:ring-1 focus:ring-primary outline-none text-sm font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addresses.label_pincode')}</label>
          <input name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="6-digit pincode" required className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm px-4 focus:ring-1 focus:ring-primary outline-none text-sm font-bold" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addresses.label_locality')}</label>
          <input name="locality" value={formData.locality} onChange={handleInputChange} placeholder="e.g. Sector 4, MG Road" className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm px-4 focus:ring-1 focus:ring-primary outline-none text-sm font-bold" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addresses.label_address')}</label>
        <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Flat, House no., Building, Company, Apartment" required className="w-full min-h-[100px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm p-4 focus:ring-1 focus:ring-primary outline-none text-sm font-bold"></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addresses.label_city')}</label>
          <input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm px-4 focus:ring-1 focus:ring-primary outline-none text-sm font-bold" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('addresses.label_state')}</label>
          <input name="state" value={formData.state} onChange={handleInputChange} placeholder="State" required className="w-full h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-sm px-4 focus:ring-1 focus:ring-primary outline-none text-sm font-bold" />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-white/10">
        <button type="button" onClick={onCancel} className="px-8 h-12 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">{t('addresses.btn_cancel')}</button>
        <button type="submit" className="bg-[#fb641b] hover:bg-[#f4511e] text-white px-12 h-12 rounded-sm font-black uppercase tracking-widest text-xs shadow-md transition-colors">{t('addresses.btn_save')}</button>
      </div>
    </form>
  );
}

export default ManageAddresses;
