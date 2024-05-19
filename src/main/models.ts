import { Model, TransactionOrKnex } from 'objection';

export class Partner extends Model {
  static tableName = 'partner';
  static idColumn = 'id';

  id!: string;
  created_at?: Date | string;
  updated_at?: Date | string;

  name!: string;
  slug!: string;
}

export const getPartnerCreditsBalance = async ({
  partnerId,
  conn,
}: {
  partnerId: string;
  conn: TransactionOrKnex;
}): Promise<number> => {
  const result = await conn("accruals")
  .sum("amount as total_partner")
  .where("partner_id", "=", partnerId);
  const answer: number = +result[0].total_partner
  return answer || 0;
};

export const addOrRemoveCreditsFromPartner = async ({
  partnerId,
  amountOfCredits,
  conn,
}: {
  partnerId: string;
  amountOfCredits: number;
  conn: TransactionOrKnex;
}): Promise<void> => {
  conn.transaction(async (trx) => {
    const balance = await getPartnerCreditsBalance({partnerId, conn: trx});
    if(balance + amountOfCredits < 0) {
      throw new Error('Balance cannot go below 0');
    }
    return await conn("accruals").insert({
      partner_id: partnerId,
      amount: amountOfCredits
    }).transacting(trx);
  })
  
};
