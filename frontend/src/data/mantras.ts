import { DeityId } from '../components/organisms/GodSpecificScreen/GodSpecificScreen';

export interface Mantra {
    id: string;
    deityId?: DeityId;
    festivalId?: string;
    isSpecial?: boolean;
    titleSanskrit: string;
    titleHindi: string;
    text: string;
    meaning: string;
}

export const MANTRAS: Mantra[] = [
    {
        id: 'hanuman_moola',
        deityId: 'hanuman',
        titleSanskrit: 'मूल मंत्र',
        titleHindi: 'moola mantra',
        text: '“ ॐ ‘हनुमते नमः ”',
        meaning: 'I bow to Lord Hanuman.',
    },
    {
        id: 'hanuman_gayatri',
        deityId: 'hanuman',
        titleSanskrit: 'हनुमान गायत्री मंत्र',
        titleHindi: 'hanuman gayatri mantra',
        text: '“ ॐ आञ्जनेयाय विद्महे वायुपुत्राय धीमहि। तन्नो हनुमत् प्रचोदयात् ”',
        meaning: 'We pray to the son of Anjani and the son of the Wind God. May Lord Hanuman illuminate our intellect.',
    },
    {
        id: 'shiv_panchakshari',
        deityId: 'shiv',
        titleSanskrit: 'पंचाक्षरी मंत्र',
        titleHindi: 'panchakshari mantra',
        text: '“ ॐ नमः शिवाय ”',
        meaning: 'I bow to Shiva.',
    },
    {
        id: 'shiv_mahamrityunjaya',
        deityId: 'shiv',
        isSpecial: true,
        titleSanskrit: 'महामृत्युंजय मंत्र',
        titleHindi: 'mahamrityunjaya mantra',
        text: '“ ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् ”',
        meaning: 'We worship the three-eyed One, who is fragrant and who nourishes all. Like the fruit falls off from the bondage of the stem, may we be liberated from death, from mortality.',
    },
    {
        id: 'ganesh_moola',
        deityId: 'ganesh',
        titleSanskrit: 'मूल मंत्र',
        titleHindi: 'moola mantra',
        text: '“ ॐ गं गणपतये नमः ”',
        meaning: 'I bow to Lord Ganesha.',
    },
    {
        id: 'ganesh_vakratunda',
        deityId: 'ganesh',
        titleSanskrit: 'वक्रतुण्ड महाकाय',
        titleHindi: 'vakratunda mahakaya',
        text: '“ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ”',
        meaning: 'O Lord with a curved trunk and a massive body, whose splendor is equal to millions of suns, please make all my endeavors free of obstacles, always.',
    },
    {
        id: 'ram_moola',
        deityId: 'ram',
        titleSanskrit: 'मूल मंत्र',
        titleHindi: 'moola mantra',
        text: '“ ॐ श्री रामाय नमः ”',
        meaning: 'I bow to Lord Rama.',
    },
    {
        id: 'krishna_moola',
        deityId: 'krishna',
        titleSanskrit: 'मूल मंत्र',
        titleHindi: 'moola mantra',
        text: '“ ॐ नमो भगवते वासुदेवाय ”',
        meaning: 'I bow to the Lord Vasudeva (Krishna).',
    },
    {
        id: 'durga_moola',
        deityId: 'durga',
        titleSanskrit: 'मूल मंत्र',
        titleHindi: 'moola mantra',
        text: '“ ॐ दुं दुर्गायै नमः ”',
        meaning: 'I bow to Goddess Durga.',
    },
    {
        id: 'laxmi_moola',
        deityId: 'laxmi',
        titleSanskrit: 'मूल मंत्र',
        titleHindi: 'moola mantra',
        text: '“ ॐ श्री महालक्ष्म्यै नमः ”',
        meaning: 'I bow to Goddess Maha Lakshmi.',
    },
    {
        id: 'shani_moola',
        deityId: 'shani',
        titleSanskrit: 'मूल मंत्र',
        titleHindi: 'moola mantra',
        text: '“ ॐ शं शनैश्चराय नमः ”',
        meaning: 'I bow to Lord Shani.',
    },
    {
        id: 'diwali_ganesh_lakshmi',
        festivalId: 'diwali',
        titleSanskrit: 'दिवाली मंत्र',
        titleHindi: 'diwali ganesh lakshmi mantra',
        text: '“ ॐ महालक्ष्म्यै नमः | ॐ गं गणपतये नमः ”',
        meaning: 'I bow to Goddess Lakshmi. I bow to Lord Ganesha.',
    },
    {
        id: 'shivaratri_moola',
        festivalId: 'shivaratri',
        titleSanskrit: 'महा शिवरात्रि मंत्र',
        titleHindi: 'maha shivaratri mantra',
        text: '“ ॐ नमः शिवाय ”',
        meaning: 'I bow to Lord Shiva.',
    },
    {
        id: 'navratri_moola',
        festivalId: 'navratri',
        titleSanskrit: 'नवरात्री मंत्र',
        titleHindi: 'navratri mantra',
        text: '“ ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे ”',
        meaning: 'I pray to the supreme goddess, who represents wisdom, wealth, and strength.',
    },
    {
        id: 'hare_krishna_mahamantra',
        isSpecial: true,
        titleSanskrit: 'हरे कृष्ण महामंत्र',
        titleHindi: 'hare krishna mahamantra',
        text: '“ हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ”',
        meaning: 'O Lord, O Energy of the Lord, please engage me in Your service.',
    }
];
