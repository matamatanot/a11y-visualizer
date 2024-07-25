import { RuleResult } from "../../rules";
import { useLang } from "../../useLang";
import {
  IoAccessibility,
  IoAlertCircle,
  IoBookmark,
  IoBrowsersOutline,
  IoCodeSlash,
  IoDocument,
  IoFlag,
  IoGrid,
  IoGridOutline,
  IoInformationCircle,
  IoLanguage,
  IoList,
  IoOpenOutline,
  IoPin,
  IoPricetag,
  IoWarning,
} from "react-icons/io5";

const Icon = ({ type }: { type: RuleResult["type"] }) => {
  const { t } = useLang();
  switch (type) {
    case "name":
      return (
        <IoAccessibility
          className="Tip__icon"
          role="img"
          aria-label={t("tip.name")}
        />
      );
    case "role":
      return (
        <IoPricetag
          className="Tip__icon"
          role="img"
          aria-label={t("tip.role")}
        />
      );
    case "tagName":
      return (
        <IoCodeSlash
          className="Tip__icon"
          role="img"
          aria-label={t("tip.element")}
        />
      );
    case "landmark":
      return (
        <IoFlag
          className="Tip__icon"
          role="img"
          aria-label={t("tip.landmark")}
        />
      );
    case "description":
      return (
        <IoDocument
          className="Tip__icon"
          role="img"
          aria-label={t("tip.description")}
        />
      );
    case "heading":
      return (
        <IoBookmark
          className="Tip__icon"
          role="img"
          aria-label={t("tip.heading")}
        />
      );
    case "warning":
      return (
        <IoWarning
          className="Tip__icon"
          role="img"
          aria-label={t("tip.warning")}
        />
      );
    case "error":
      return (
        <IoAlertCircle
          className="Tip__icon"
          role="img"
          aria-label={t("tip.error")}
        />
      );
    case "state":
      return (
        <IoInformationCircle
          className="Tip__icon"
          role="img"
          aria-label={t("tip.ariaStatus")}
        />
      );
    case "tableHeader":
      return (
        <IoGrid
          className="Tip__icon"
          role="img"
          aria-label={t("tip.tableHeader")}
        />
      );
    case "tableSize":
      return (
        <IoGridOutline
          className="Tip__icon"
          role="img"
          aria-label={t("tip.tableSize")}
        />
      );
    case "tableCellPosition":
      return (
        <IoPin
          className="Tip__icon"
          role="img"
          aria-label={t("tip.tablePosition")}
        />
      );

    case "linkTarget":
      return (
        <IoOpenOutline
          className="Tip__icon"
          role="img"
          aria-label={t("tip.linkTarget")}
        />
      );

    case "pageTitle":
      return (
        <IoBrowsersOutline
          className="Tip__icon"
          role="img"
          aria-label={t("tip.pageTitle")}
        />
      );
    case "lang":
      return (
        <IoLanguage
          className="Tip__icon"
          role="img"
          aria-label={t("tip.lang")}
        />
      );
    case "list":
      return (
        <IoList className="Tip__icon" role="img" aria-label={t("tip.list")} />
      );
  }
};
export const RuleTip = ({
  result,
  hideLabel = false,
  maxWidth,
}: {
  result: RuleResult;
  hideLabel: boolean;
  maxWidth: number;
}) => {
  const { t } = useLang();

  return (
    <div
      className={["Tip", `Tip--${result.type}`].join(" ")}
      style={{ maxWidth }}
    >
      <Icon type={result.type} />
      {!hideLabel &&
        (result.type === "error"
          ? t(result.message)
          : result.type === "warning"
            ? t(result.message)
            : result.type === "state"
              ? t(result.state)
              : `${result.contentLabel ? t(result.contentLabel) : ""} ${t(result.content)}`)}
    </div>
  );
};
