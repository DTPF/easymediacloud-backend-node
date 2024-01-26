import { Response } from "express";
import { IRequestUser } from "../../../interfaces/user.interface";
import i18next from "i18next";
import { BASIC, CUSTOM, FREE, PREMIUM } from "../subscriptionsConstants";
import SubscriptionModel from "../models/subscription.model";
import { convertBytes } from "../../../utils/getFolderSize";
import moment from "moment";
import { ISubscription } from "../../../interfaces/subscription.interface";
import { subscriptionKey } from "../../responseKey";
const t = i18next.t

export async function customSubscription(req: IRequestUser, res: Response) {
  const { subscriptionId } = req.params
  // Return error if subscriptionId is not provided
  if (!subscriptionId) {
    return res.status(400).send({ status: subscriptionKey.subscriptionIdRequired, message: t('subscription-id_required') })
  }
  const { type, price, currency, maxSize, expire, enabled, requestsPerMonth } = req.body
  // Return error if no data is provided
  if (!type && !price && !currency && !maxSize && !expire && !enabled && !requestsPerMonth) {
    return res.status(400).send({ status: subscriptionKey.subscriptionDataRequired, message: t('subscription_data_required') })
  }
  // Return error if type is not valid
  if (type && ![FREE, BASIC, PREMIUM, CUSTOM].includes(type)) {
    return res.status(400).send({ status: subscriptionKey.subscriptionTypeInvalid, message: t('subscription_type_invalid') })
  }
  // Return error if price is not valid
  if (price && typeof price !== 'number') {
    return res.status(400).send({ status: subscriptionKey.subscriptionPriceInvalid, message: t('subscription_price_invalid') })
  }
  // Return error if currency is not valid
  if (currency && typeof currency !== 'string') {
    return res.status(400).send({ status: subscriptionKey.subscriptionCurrencyInvalid, message: t('subscription_currency_invalid') })
  }
  // Return error if maxSize is not valid
  if (maxSize && typeof maxSize !== 'number') {
    return res.status(400).send({ status: subscriptionKey.subscriptionMaxSizeInvalid, message: t('subscription_maxSize_invalid') })
  }
  // Return error if expire is not valid
  if (expire && typeof expire !== 'string') {
    return res.status(400).send({ status: subscriptionKey.subscriptionExpireInvalid, message: t('subscription_expire_invalid') })
  }
  // Return error if enabled is not valid
  if (enabled && typeof enabled !== 'boolean') {
    return res.status(400).send({ status: subscriptionKey.subscriptionEnableInvalid, message: t('subscription_enabled_invalid') })
  }
  // Convert maxSize to bytes and assign to maxSizeT
  if (maxSize && typeof maxSize === 'number') {
    req.body.maxSizeT = convertBytes(maxSize)
  }
  try {
    const updateSubscription = await SubscriptionModel.findOneAndUpdate({ _id: subscriptionId }, req.body, { new: true }).lean().exec()
    if (!updateSubscription) {
      return res.status(404).send({ status: subscriptionKey.subscriptionNotFound, message: t('subscription-not-found') })
    }
    return res.status(200).send({
      message: t('subscription_updated-success'),
      status: subscriptionKey.subscriptionUpdatedSuccess,
      subscription: updateSubscription
    })
  } catch (err) {
    return res.status(500).send({ status: subscriptionKey.subscriptionServerError, message: t('subscription_update_error') })
  }
}

export async function renewFreeSubscription(req: IRequestUser, res: Response) {
  const { subscriptionId } = req.params
  // Return error if subscriptionId is not provided
  if (!subscriptionId) {
    return res.status(400).send({ status: subscriptionKey.subscriptionIdRequired, message: t('subscription-id_required') })
  }
  const findSubscription: ISubscription = await SubscriptionModel.findOne({ _id: subscriptionId }).lean().exec()
  if (!findSubscription) {
    return res.status(404).send({ status: subscriptionKey.subscriptionNotFound, message: t('subscription-not-found') })
  }
  // Return error if user is not the owner of the subscription
  if (findSubscription.user?.toString() !== req.user._id.toString()) {
    return res.status(403).send({ status: subscriptionKey.subscriptionNotAllowed, message: t('subscription_action_not_allowed') })
  }
  try {
    const updateSubscription: ISubscription = await SubscriptionModel.findOneAndUpdate(
      { _id: subscriptionId },
      { expire: moment(findSubscription.expire).add(1, 'year') },
      { new: true }).lean().exec()
    if (!updateSubscription) {
      return res.status(404).send({ status: subscriptionKey.subscriptionNotFound, message: t('subscription-not-found') })
    }
    return res.status(200).send({
      message: t('subscription_updated-success'),
      status: subscriptionKey.subscriptionUpdatedSuccess,
      subscription: updateSubscription
    })
  } catch (err) {
    return res.status(500).send({ status: subscriptionKey.subscriptionServerError, message: t('subscription_update_error') })
  }
}
