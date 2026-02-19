import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ text = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full h-full">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">{text}</p>
        </div>
    );
};

export default Loader;
