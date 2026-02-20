import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, label, required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef(null);

    // Update filtered options when search term or options change
    useEffect(() => {
        setFilteredOptions(
            options.filter(option =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (option.subLabel && option.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        );
    }, [searchTerm, options]);

    // specific effect to clear search term if value is cleared externally
    useEffect(() => {
        if (!value) {
            setSearchTerm('');
        }
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {label && (
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {label}
                </label>
            )}

            <div
                className={`w-full px-3 py-2.5 bg-gray-50 border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-300'} rounded-lg cursor-pointer transition-all flex items-center justify-between`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate">
                    {selectedOption ? (
                        <span className="text-sm font-semibold text-gray-900">
                            {selectedOption.label}
                            {selectedOption.subLabel && <span className="font-normal text-gray-500 ml-1">({selectedOption.subLabel})</span>}
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">{placeholder || 'Select...'}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {value && !required && (
                        <div
                            onClick={handleClear}
                            className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col animate-fade-in-up">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50 sticky top-0">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors flex items-center justify-between group ${value === option.value
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <div>
                                        {option.label}
                                        {option.subLabel && <span className={`ml-1 ${value === option.value ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`}>({option.subLabel})</span>}
                                    </div>
                                    {value === option.value && <Check size={16} className="text-indigo-600" />}
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

export default SearchableSelect;
