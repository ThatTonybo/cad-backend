import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { isMatch } from 'date-fns';
import { IAuthenticatedResponse, ICharacterCitationArrest, ICharacterWarrant } from '../interfaces';
import { requireAuthentication, requireLEO, requireVerified } from '../util/authentication';
import { validateAddress } from '../util/address';
import { Character } from '../models/Character';
import { CharacterCreateCitationArrestSchema, CharacterCreateSchema, CharacterCreateWarrantSchema, CharacterUpdateBasicsSchema } from '../schemas/Character';

export const route = Router();

/**
 * Create a new character
 */
route.post('/', requireAuthentication, requireVerified, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const validation = await CharacterCreateSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({ errors: validation.error.issues }).end();

    if (!isMatch(validation.data.dob, 'yyyy-MM-dd')) return res.status(400).json({ error: 'Invalid date provided for: dob' });

    const charactersWithExistingName = await Character.find((x) => x && x.name.toLowerCase() === validation.data.name).clone();
    if (charactersWithExistingName.length > 0) return res.status(400).json({ error: 'A character with that name already exists' }).end();

    const character = new Character({
        owner: new Types.ObjectId(res.locals.session.id),
        name: validation.data.name,
        gender: validation.data.gender,
        dob: validation.data.dob,
        address: validation.data.address,
        caution: false,
        licenses: {},
        weapons: [],
        citations: [],
        arrests: [],
        warrants: []
    });

    await character.save();

    return res.status(201).json({
        id: character._id
    });
});

/**
 * Get all the authenticated account's characters
 */
route.get('/@me', requireAuthentication, requireVerified, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const characters = await Character.find({ owner: new Types.ObjectId(res.locals.session.id) });

    const filteredCharacters = characters.map(({ __v, ...character }) => character);

    return res.json(filteredCharacters);
});

/**
 * Get a specific character (that you own)
 */
route.get('/:characterID', requireAuthentication, requireVerified, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const character = await Character.findById(req.params.characterID);
    if (!character) return res.status(404).json({ error: 'Character not found' }).end();

    if (character.owner.toString() !== res.locals.session.id) return res.status(403).json({ error: 'Invalid authorization' }).end();

    const data = {
        owner: character.owner,
        name: character.name,
        gender: character.gender,
        dob: character.dob,
        address: character.address,
        licenses: character.licenses,
        weapons: character.weapons,
        citations: character.citations,
        arrests: character.arrests
    };

    return res.json(data);
});

/**
 * Edit a character
 */
route.patch('/:characterID', requireAuthentication, requireVerified, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const character = await Character.findById(req.params.characterID);
    if (!character) return res.status(404).json({ error: 'Character not found' }).end();

    if (character.owner.toString() !== res.locals.session.id) return res.status(403).json({ error: 'Invalid authorization' }).end();

    const validation = await CharacterUpdateBasicsSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({
        errors: validation.error.issues
    }).end();

    const changes = validation.data ?? {};

    // Individual Validation
    if (changes.name && (changes.name === character.name)) return res.status(400).json({ error: 'Value not changed from current value: name' });
    if (changes.gender && (changes.gender === character.gender)) return res.status(400).json({ error: 'Value not changed from current value: gender' });

    if (changes.dob) {
        if (changes.dob === character.dob) return res.status(400).json({ error: 'Value not changed from current value: dob' });
        if (!isMatch(changes.dob, 'yyyy-MM-dd')) return res.status(400).json({ error: 'Invalid date provided for: dob' });
    }

    if (changes.address) {
        if (changes.address === character.address) return res.status(400).json({ error: 'Value not changed from current value: address' });

        const isAddressValid = await validateAddress(changes.address);
        if (isAddressValid === false) return res.status(400).json({ error: 'Invalid address provided (format: \'[postal] [street name], [suburb]\')' });
    }

    if (changes.licenses && (changes.licenses === character.licenses)) return res.status(400).json({ error: 'Value not changed from current value: address' });
    if (changes.weapons && (changes.weapons === character.weapons)) return res.status(400).json({ error: 'Value not changed from current value: address' });


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const key in changes) (character as any)[key] = changes[key as keyof typeof changes];

    await character.save();

    return res.json({ result: `${Object.keys(req.body).length} change(s) saved` });
});

/**
 * Delete a character
 */
route.delete('/:characterID', requireAuthentication, requireVerified, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const character = await Character.findById(req.params.characterID);
    if (!character) return res.status(404).json({ error: 'Character not found' }).end();

    if (character.owner.toString() !== res.locals.session.id) return res.status(403).json({ error: 'Invalid authorization' }).end();

    await character.deleteOne();

    return res.status(204).end();
});

/**
 * Create a citation for this character
 */
route.post('/:characterID/citation', requireAuthentication, requireVerified, requireLEO, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const character = await Character.findById(req.params.characterID);
    if (!character) return res.status(404).json({ error: 'Character not found' }).end();

    const validation = await CharacterCreateCitationArrestSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({
        errors: validation.error.issues
    }).end();

    const citation: ICharacterCitationArrest = {
        date: validation.data.date,
        info: validation.data.info,
        officer: new Types.ObjectId(res.locals.session.id),
        location: validation.data.location
    };

    character.citations.push(citation);

    return res.status(204).end();
});

/**
 * Create an arrest for this character
 */
route.post('/:characterID/arrest', requireAuthentication, requireVerified, requireLEO, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const character = await Character.findById(req.params.characterID);
    if (!character) return res.status(404).json({ error: 'Character not found' }).end();

    const validation = await CharacterCreateCitationArrestSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({
        errors: validation.error.issues
    }).end();

    const arrest: ICharacterCitationArrest = {
        date: validation.data.date,
        info: validation.data.info,
        officer: new Types.ObjectId(res.locals.session.id),
        location: validation.data.location
    };

    character.arrests.push(arrest);

    return res.status(204).end();
});

/**
 * Create a warrant for this character
 */
route.post('/:characterID/warrant', requireAuthentication, requireVerified, requireLEO, async (req: Request, res: Response<unknown, IAuthenticatedResponse>) => {
    const character = await Character.findById(req.params.characterID);
    if (!character) return res.status(404).json({ error: 'Character not found' }).end();

    const validation = await CharacterCreateWarrantSchema.safeParse(req.body);

    if (validation.success === false) return res.status(400).json({
        errors: validation.error.issues
    }).end();

    const warrant: ICharacterWarrant = {
        date: validation.data.date,
        info: validation.data.info,
        officer: new Types.ObjectId(res.locals.session.id),
        status: validation.data.status
    };

    character.warrants.push(warrant);

    return res.status(204).end();
});