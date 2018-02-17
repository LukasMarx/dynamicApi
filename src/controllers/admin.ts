import { graphql } from 'graphql';
import { Response, Request, NextFunction } from "express";
import { schema } from '../schema/schema';

export let getAdmin = async (req: Request, res: Response) => {
    const user = req.user;
    const result = await graphql(schema, req.query.query, null, { user: user });
    if(result){
        res.send(result);
    }
};
  
  export let postAdmin = async (req: Request, res: Response)=> {
    const user = req.user;
    const body = req.body;
    console.log(user);
    const result = await graphql(schema, body.query, null, { user: user }, body.variables);
    if(result) res.send(result);
  };
  