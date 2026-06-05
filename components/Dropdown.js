'use client';
import { useState, useRef, useEffect } from 'react';

export default function Dropdown({ options, value, onChange, placeholder = "Select an option", className = "", isMulti = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getOptionLabel = (opt) => typeof opt === 'object' && opt !== null ? opt.label : opt;
  const getOptionValue = (opt) => typeof opt === 'object' && opt !== null ? opt.value : opt;
  
  const handleSelect = (optValue) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter(v => v !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const renderDisplay = () => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
      if (currentValues.length === 0) return placeholder;
      
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {currentValues.map(val => {
            const opt = options.find(o => getOptionValue(o) === val);
            return (
              <span key={val} style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {opt ? getOptionLabel(opt) : val}
                <button type="button" onClick={(e) => { e.stopPropagation(); handleSelect(val); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0' }}>&times;</button>
              </span>
            );
          })}
        </div>
      );
    }

    const selectedOption = options.find(opt => getOptionValue(opt) === value);
    return selectedOption ? getOptionLabel(selectedOption) : (value || placeholder);
  };

  const isSelected = (optValue) => {
    if (isMulti) {
      return Array.isArray(value) ? value.includes(optValue) : value === optValue;
    }
    return value === optValue;
  };

  return (
    <div className={`custom-dropdown ${className}`} ref={dropdownRef}>
      <div 
        className="custom-dropdown-header input-glass" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ minHeight: '42px', padding: isMulti && Array.isArray(value) && value.length > 0 ? '6px 12px' : '10px 14px' }}
      >
        <span>{renderDisplay()}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`} 
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {isOpen && (
        <ul className="custom-dropdown-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
          {options.map((opt, i) => {
            const optValue = getOptionValue(opt);
            const selected = isSelected(optValue);
            return (
              <li 
                key={optValue || i} 
                className={`custom-dropdown-item ${selected ? 'selected' : ''}`}
                onClick={() => handleSelect(optValue)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isMulti && (
                  <div style={{ width: '16px', height: '16px', border: '1px solid var(--border)', borderRadius: '4px', background: selected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                )}
                {getOptionLabel(opt)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
