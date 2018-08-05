import { database } from '../services/database';
import { Request, Response } from 'express';

export const healthz = async (req: Request, res: Response) => {
  const db = await database.connect();
  let healthy = true;
  if ((<any>db).serverConfig.isConnected()) {
    healthy = false;
  }
  if (healthy) return res.sendStatus(200);
  else return res.sendStatus(500);
};
