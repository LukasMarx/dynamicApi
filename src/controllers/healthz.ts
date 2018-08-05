import { database } from '../services/database';
import { Request, Response } from 'express';

export const healthz = async (req: Request, res: Response) => {
  const db = await database.connect();
  let healthy = true;
  if ((<any>db).serverConfig.isConnected()) {
    healthy = false;
  }
  healthy ? res.sendStatus(200) : res.sendStatus(500);
};
