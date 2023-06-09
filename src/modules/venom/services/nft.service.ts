import { Inject, Injectable } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { Address, ProviderRpcClient, TvmException } from 'everscale-inpage-provider'
import { EverscaleStandaloneClient } from 'everscale-standalone-client/nodejs'
import { ConfigService } from '@nestjs/config'

import { nftAbi, nftCollectionAbi } from '../abi'
import { TNfts } from '../interfaces'

@Injectable()
export class NftService {
  private readonly rpcUrl: string
  private readonly codeHash: string
  private readonly collectionAddress: string

  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger, private readonly configService: ConfigService) {
    const rpcUrl = configService.get('RPC_URL')
    if (!rpcUrl) {
      throw new Error('Not found env RPC_URL')
    }

    const codeHash = configService.get('CODE_HASH')
    if (!codeHash) {
      throw new Error('Not found env CODE_HASH')
    }

    const collectionAddress = configService.get('COLLECTION_ADDRESS')
    if (!codeHash) {
      throw new Error('Not found env COLLECTION_ADDRESS')
    }

    this.rpcUrl = rpcUrl
    this.codeHash = codeHash
    this.collectionAddress = collectionAddress
  }

  async getNfts(): Promise<TNfts | Error> {
    const client = new ProviderRpcClient({
      fallback: () =>
        EverscaleStandaloneClient.create({
          connection: {
            id: 2, // network id
            type: 'graphql',
            data: {
              endpoints: [this.rpcUrl],
            },
          },
        }),
    })

    await client.ensureInitialized()

    await client.requestPermissions({
      permissions: ['basic'],
    })

    try {
      const accounts = await client.getAccountsByCodeHash({ codeHash: this.codeHash })

      const nfts: TNfts = []

      for (const acc of accounts.accounts) {
        const nftContractAddress = new Address(acc.toString())
        const nftContract = new client.Contract(nftAbi, nftContractAddress)
        const nftInfo = await nftContract.methods.getDomainInfo({ answerId: 0 }).call()

        const collectionAddress = new Address(this.collectionAddress)
        const collectionContract = new client.Contract(nftCollectionAbi, collectionAddress)
        const subPriceInfo = await collectionContract.methods.getSubDomainPrice({ answerId: 0, domain: acc }).call()

        nfts.push({
          address: acc.toString(),
          owner: nftInfo.domainOwner.toString(),
          hPrice: Number(nftInfo.domainHPrice.toString()),
          name: nftInfo.domainName.toString(),
          parentAddress: nftInfo.domainRoot.toString(),
          id: Number(nftInfo.id),
          subPrice: Number(subPriceInfo.subPrice),
        })
      }

      return nfts
    } catch (err) {
      if (err instanceof TvmException) {
        this.logger.error(`Error venom: ${err}`)
        return new Error(`Error venom: ${err}`)
      }

      return new Error(`Error in venom: ${err}`)
    }
  }
}
