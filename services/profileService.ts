const NAME_KEY = 'otakonUserName';

const getName = (): string | null => {
    return localStorage.getItem(NAME_KEY);
};

const setName = (name: string) => {
    if (name.trim()) {
        localStorage.setItem(NAME_KEY, name.trim());
    } else {
        localStorage.removeItem(NAME_KEY);
    }
};

const reset = () => {
    localStorage.removeItem(NAME_KEY);
};

export const profileService = {
    getName,
    setName,
    reset,
};
