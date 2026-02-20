import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

const SearchableCombobox = ({ options, value, onChange, placeholder, label, required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Sync input value with selected option when value changes externally
    useEffect(() => {
        const selected = options.find(opt => opt.value === value);
        if (selected) {
            setInputValue(selected.label);
        } else {
            setInputValue(''); // Only clear if we explicitly don't have a value. 
            // We might want to keep user input if they typed something invalid? 
            // But for a Select, usually selection must be valid.
        }
    }, [value, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset input to selected value on blur without selection
                const selected = options.find(opt => opt.value === value);
                if (selected) {
                    setInputValue(selected.label);
                } else {
                    setInputValue('');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, options]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(inputValue.toLowerCase()))
    );

    const handleSelect = (option) => {
        onChange(option.value);
        setInputValue(option.label);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setIsOpen(true);
        if (!e.target.value) {
            onChange(''); // clear selection if input cleared
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setInputValue('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {label && (
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className={`w-full pl-3 pr-10 py-2.5 bg-gray-50 border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-300'} rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-semibold text-gray-900 placeholder-gray-400`}
                    placeholder={placeholder || 'Select...'}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                />

                <div className="absolute right-3 top-2.5 flex items-center gap-2 pointer-events-none">
                    {/* Clear button needs pointer-events-auto */}
                    {value && !required && (
                        <div
                            onClick={handleClear}
                            className="pointer-events-auto p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-fade-in-up">
                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors flex items-center justify-between group ${value === option.value
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    onMouseDown={() => handleSelect(option)} // Use onMouseDown to prevent blur before click
                                >
                                    <div>
                                        {option.label}
                                        {option.subLabel && <span className={`ml-1 ${value === option.value ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`}>({option.subLabel})</span>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm italic">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableCombobox;
