import { useMemo } from 'react'
import styled from 'styled-components'
import networks from '@/loan/networks'
import useStore from '@/loan/store/useStore'
import { ChainId } from '@/loan/types/loan.types'
import DetailInfo from '@ui/DetailInfo'
import IconTooltip from '@ui/Tooltip/TooltipIcon'
import { BN, FORMAT_OPTIONS, formatNumber } from '@ui/utils'
import { t } from '@ui-kit/lib/i18n'
import { gweiToEther, weiToGwei } from '@ui-kit/utils'

export type StepProgress = {
  active: number
  total: number
}

interface Props {
  chainId: ChainId
  isDivider?: boolean
  loading?: boolean
  estimatedGas: number | null
  activeStep?: number
  stepProgress?: StepProgress | null
}

const DetailInfoEstimateGas = ({ chainId, isDivider = false, loading, estimatedGas, stepProgress }: Props) => {
  const chainTokenUsdRate = useStore((state) => state.usdRates.tokens['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'])
  const gasPricesDefault = chainId && networks[chainId].gasPricesDefault
  // TODO: allow gas prices priority adjustment
  const basePlusPriorities = useStore((state) => state.gas.gasInfo?.basePlusPriority)
  const basePlusPriority =
    basePlusPriorities && typeof gasPricesDefault !== 'undefined' && basePlusPriorities[gasPricesDefault]

  const { estGasCostUsd, tooltip } = useMemo(() => {
    if (estimatedGas && chainId && chainTokenUsdRate && basePlusPriority) {
      const { symbol, gasPricesUnit } = networks[chainId]

      const estGasCost = new BN(gweiToEther(weiToGwei(basePlusPriority) * estimatedGas))
      if (chainTokenUsdRate === 'NaN') {
        return { estGasCost: estGasCost.toString(), estGasCostUsd: 'NaN', tooltip: '' }
      } else {
        const estGasCostUsd = estGasCost.multipliedBy(chainTokenUsdRate).toString()
        const gasAmountUnit = formatNumber(weiToGwei(basePlusPriority), { maximumFractionDigits: 2 })
        const tooltip = `${formatNumber(estGasCost.toString())} ${symbol} at ${gasAmountUnit} ${gasPricesUnit}`
        return { estGasCost: estGasCost.toString(), estGasCostUsd, tooltip }
      }
    }
    return { estGasCost: 0, estGasCostUsd: 0, tooltip: '' }
  }, [chainTokenUsdRate, basePlusPriority, chainId, estimatedGas])

  return (
    <DetailInfo
      isDivider={isDivider}
      loading={loading}
      loadingSkeleton={[50, 20]}
      label={
        stepProgress ? (
          <>
            <span>{t`Estimated TX cost`}</span>{' '}
            <StepProgressWrapper>({t`Step ${stepProgress.active} of ${stepProgress.total}`}):</StepProgressWrapper>
          </>
        ) : (
          t`Estimated TX cost:`
        )
      }
      tooltip={
        tooltip ? (
          <IconTooltip placement="top-end" noWrap>
            {tooltip}
          </IconTooltip>
        ) : null
      }
    >
      {estGasCostUsd ? (
        estGasCostUsd === 'NaN' ? (
          t`Unable to get USD rate`
        ) : (
          <span>{formatNumber(estGasCostUsd, FORMAT_OPTIONS.USD)}</span>
        )
      ) : (
        ''
      )}
    </DetailInfo>
  )
}

const StepProgressWrapper = styled.span`
  font-size: var(--font-size-0);
  text-transform: uppercase;
`

export default DetailInfoEstimateGas
