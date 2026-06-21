
function getDeterministicIndex(id) {
    const idStr = String(id);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = (hash << 5) - hash + idStr.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

const colorOptions = ['blue', 'teal', 'lavender', 'amber', 'green', 'pink'];
const iconOptions = ['📘', '📗', '📙', '📔', '📕', '📓'];

export function mapDbSubjectToUi(dbSubject) {
    const index = getDeterministicIndex(dbSubject.id);
    const color = colorOptions[index % colorOptions.length];
    const icon = iconOptions[index % iconOptions.length];

    return {
        id: dbSubject.id,
        rawId: dbSubject.id,
        isCustom: false,
        name: dbSubject.name,
        code: dbSubject.code || '',
        credits: Number(dbSubject.credits) || 3,
        branch: dbSubject.branch,
        semester: dbSubject.semester,
        sem: dbSubject.semester, // Legacy
        reg: dbSubject.regulation_code, // Legacy
        uni: dbSubject.university_name, // Legacy
        year: dbSubject.year || null,
        status: dbSubject.status || 'Published',
        units: 5, // Default for display
        color,
        icon,
    };
}

export function mapLocalStorageSubjectToUi(localSubject) {
    const index = getDeterministicIndex(localSubject.id);
    const color = colorOptions[index % colorOptions.length];
    const icon = iconOptions[index % iconOptions.length];

    return {
        id: 'custom_' + localSubject.id,
        rawId: localSubject.id,
        isCustom: true,
        name: localSubject.name,
        code: localSubject.code || '',
        credits: Number(localSubject.credits) || 3,
        branch: localSubject.branch,
        semester: localSubject.sem, // Note: local subjects use 'sem'
        sem: localSubject.sem,
        reg: localSubject.reg,
        uni: localSubject.uni,
        year: localSubject.year || null,
        status: 'Published',
        units: 5, // Default for display
        color,
        icon,
    };
}

export function mergeSubjectSources(dbSubjects, localSubjects) {
    const seen = new Set();
    const merged = [];

    const subjects = [...dbSubjects, ...localSubjects];

    for (const subject of subjects) {
        const key = [
            subject.name?.toLowerCase(),
            subject.branch?.toLowerCase(),
            subject.semester?.toLowerCase(),
            subject.reg?.toLowerCase(), // Use legacy 'reg' field
            subject.uni?.toLowerCase(), // Use legacy 'uni' field
        ].join('|');

        if (!seen.has(key)) {
            seen.add(key);
            merged.push(subject);
        }
    }

    return merged;
}
