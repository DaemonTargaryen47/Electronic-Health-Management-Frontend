"use client";
import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState("light");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedTheme = localStorage.getItem("theme") || "light";
        setTheme(storedTheme);
    }, []);

    if (!isMounted) return <>Loading ...</>;

    const changeTheme = (theme) => {
        setTheme(theme);
        localStorage.setItem("theme", theme);
    };

    return (
        <ThemeContext.Provider value={{ theme, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
