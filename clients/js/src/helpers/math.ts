import { BN } from "@coral-xyz/anchor";
import Decimal from "decimal.js";

export enum Rounding {
  Up,
  Down,
}

export function mulShr(x: BN, y: BN, offset: number, rounding: Rounding) {
  const denominator = new BN(1).shln(offset);
  return mulDiv(x, y, denominator, rounding);
}

export function shlDiv(x: BN, y: BN, offset: number, rounding: Rounding) {
  const scale = new BN(1).shln(offset);
  return mulDiv(x, scale, y, rounding);
}

export function mulDiv(x: BN, y: BN, denominator: BN, rounding: Rounding) {
  const { div, mod } = x.mul(y).divmod(denominator);

  if (rounding === Rounding.Up && !mod.isZero()) {
    return div.add(new BN(1));
  }
  return div;
}

export function getPricePerLamport(
  tokenXDecimal: number,
  tokenYDecimal: number,
  price: number
): string {
  return new Decimal(price)
    .mul(new Decimal(10 ** (tokenYDecimal - tokenXDecimal)))
    .toString();
}
