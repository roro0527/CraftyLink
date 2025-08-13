# **App Name**: CraftyLink

## Core Features:

- URL Input: Users can input multiple URLs (or multiple pasted text) that each include key value pairs in the URL parameters.
- Parsed Data Review: Display each inputted URL, parsed in key-value pair format, to enable review and editing by the user.
- Suggested Super-Parameters: Using an LLM as a tool, suggest a small number of composite 'super-parameters' that contain relevant combinations of parameters and their possible values.
- Super-Parameter Configuration: Allow the user to edit and/or accept the generated 'super-parameters'.
- URL Permutation Generation: Automatically generate all possible query URLs given the 'super-parameters', so the user can then visit all permutations of the generated URLs.
- Generated URL Display: Display each generated URL so user can click them. Consider filtering options and copy-to-clipboard functionality for multiple links

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5), conveying intelligence, insight, and thoughtfulness.
- Background color: Very light indigo (#E8EAF6), providing a gentle, neutral backdrop.
- Accent color: Vibrant violet (#7E57C2), used for interactive elements and highlights.
- Font: 'Inter', a sans-serif font for clear, modern readability across all UI elements.
- Use minimalist, line-based icons to represent various functions and URL components.
- Maintain a clean and structured layout with clear divisions between input, parsed data, and generated URLs.
- Incorporate subtle transitions and animations for loading states and data processing to improve UX.