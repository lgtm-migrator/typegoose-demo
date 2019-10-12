import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import { authenticate } from '../auth';
import { jwtSecret } from '../config/jwt';
import { ArmyDto, ArmyModel } from '../entity/Army';
import { Request } from '../models';

export const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello World');
});

router.get('/sse', (req, res) => {
  res.write('Connected');
  res.write('Hello');
  req.on('close', () => {
    console.log('closed');
  });
});

router.post(
  '/join',
  async (req: Request<ArmyDto>, res, next) => {
    const { headers } = req;
    if (!Object.keys(headers).includes('authorization')) {
      const { body: armyDto } = req;

      try {
        const army = await ArmyModel.create({ ...armyDto, active: true });

        const activeArmies = await ArmyModel.find({ active: true });

        const token = jwt.sign({ army }, jwtSecret);
        return res.json({ token, armies: activeArmies });
      } catch (error) {
        res.status(400);

        res.json(error);
      }
    }

    return next();
  },
  authenticate,
  async (req, res) => {
    const activeArmies = await ArmyModel.find({ active: true });

    return res.json({ armies: activeArmies });
  },
);

router.get('/armies', authenticate, async (req, res) => {
  const armies = await ArmyModel.find();

  res.json(armies);
});