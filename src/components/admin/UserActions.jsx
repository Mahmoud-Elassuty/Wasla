import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserStatus } from "../../store/reducers/adminSlice";
import { showError, showSuccess } from "../../utils/notifications";
import { SELF_ACTION_MESSAGE, getUserStatus } from "../../utils/users";
import { useT } from "../../i18n/useT";

// Every status change is a PATCH of `status` only. Restrict and Delete ask for confirmation first;
// Unrestrict and Restore just put the account back to "active".
const ACTIONS = {
  restrict: {
    next: "restricted",
    label: "Restrict",
    busy: "Restricting...",
    question: "Restrict this user?",
    tone: "btn-outline-warning",
    done: "{name} was restricted and can no longer log in.",
    confirm: true,
  },
  unrestrict: {
    next: "active",
    label: "Unrestrict",
    busy: "Saving...",
    tone: "btn-outline-success",
    done: "{name} is active again.",
  },
  delete: {
    next: "deleted",
    label: "Soft delete",
    busy: "Deleting...",
    question: "Soft delete this user?",
    tone: "btn-outline-danger",
    done: "{name} was soft-deleted. The record is kept and can be restored.",
    confirm: true,
  },
  restore: {
    next: "active",
    label: "Restore",
    busy: "Restoring...",
    tone: "btn-outline-success",
    done: "{name} was restored.",
  },
};

const ACTIONS_BY_STATUS = {
  active: ["restrict", "delete"],
  restricted: ["unrestrict", "delete"],
  deleted: ["restore"],
};

export default function UserActions({ user }) {
  const { t } = useT();
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const updating = useSelector((s) => s.admin.updatingUserIds.includes(user.id));
  const [confirming, setConfirming] = useState(null);

  const isSelf = String(currentUser?.id) === String(user.id);
  const keys = ACTIONS_BY_STATUS[getUserStatus(user)] ?? ["restrict", "delete"];

  const run = async (key) => {
    const action = ACTIONS[key];
    setConfirming(null);
    try {
      await dispatch(updateUserStatus({ id: user.id, status: action.next })).unwrap();
      dispatch(showSuccess(t(action.done, { name: user.name || user.email })));
    } catch (err) {
      dispatch(showError(typeof err === "string" ? err : t("Couldn't update the user.")));
    }
  };

  if (confirming) {
    const action = ACTIONS[confirming];
    return (
      <span className="d-inline-flex align-items-center gap-2">
        <span className="small">{t(action.question)}</span>
        <button type="button" className="btn btn-sm btn-danger" disabled={updating} onClick={() => run(confirming)}>
          {t("Yes")}
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirming(null)}>
          {t("No")}
        </button>
      </span>
    );
  }

  return (
    <span className="d-inline-flex flex-wrap gap-2" title={isSelf ? t(SELF_ACTION_MESSAGE) : undefined}>
      {keys.map((key) => {
        const action = ACTIONS[key];
        return (
          <button
            key={key}
            type="button"
            className={`btn btn-sm ${action.tone}`}
            disabled={isSelf || updating}
            aria-label={`${t(action.label)} ${user.name || user.email}`}
            onClick={() => (action.confirm ? setConfirming(key) : run(key))}
          >
            {updating ? t(action.busy) : t(action.label)}
          </button>
        );
      })}
    </span>
  );
}
