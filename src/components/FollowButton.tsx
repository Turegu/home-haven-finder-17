import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  /** 'company' or 'agent' */
  type: 'company' | 'agent';
  /** The company or agent ID to follow */
  targetId: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

const FollowButton = ({ type, targetId, size = 'sm' }: FollowButtonProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let followData = null;
      if (type === 'company') {
        const { data } = await supabase
          .from('company_followers')
          .select('id')
          .eq('company_id', targetId)
          .eq('user_id', user.id)
          .maybeSingle();
        followData = data;
      } else {
        const { data } = await supabase
          .from('agent_followers')
          .select('id')
          .eq('agent_id', targetId)
          .eq('user_id', user.id)
          .maybeSingle();
        followData = data;
      }

      setIsFollowing(!!followData);
      setLoading(false);
    };
    checkFollowStatus();
  }, [type, targetId]);

  const handleToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('detail.followSignIn'));
      navigate('/user/login');
      return;
    }

    setToggling(true);

    try {
      if (isFollowing) {
        if (type === 'company') {
          const { error } = await supabase
            .from('company_followers')
            .delete()
            .eq('company_id', targetId)
            .eq('user_id', user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('agent_followers')
            .delete()
            .eq('agent_id', targetId)
            .eq('user_id', user.id);
          if (error) throw error;
        }
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        if (type === 'company') {
          const { error } = await supabase
            .from('company_followers')
            .insert({ company_id: targetId, user_id: user.id });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('agent_followers')
            .insert({ agent_id: targetId, user_id: user.id });
          if (error) throw error;
        }
        setIsFollowing(true);
        toast.success('Following! You\'ll receive updates and announcements.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setToggling(false);
    }
  };

  const sizeClasses = size === 'md'
    ? 'h-10 text-sm px-5 gap-2'
    : 'h-8 text-xs px-4 gap-1.5';

  const iconSize = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  if (loading) {
    return (
      <button className={`inline-flex items-center rounded-full shrink-0 font-medium bg-muted text-muted-foreground ${sizeClasses}`} disabled>
        <Loader2 className={`${iconSize} animate-spin`} />
      </button>
    );
  }

  return (
    <button
      className={`inline-flex items-center rounded-full shrink-0 font-medium transition-colors disabled:opacity-50 ${sizeClasses} ${
        isFollowing
          ? 'bg-primary text-primary-foreground hover:bg-primary/80'
          : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
      }`}
      onClick={handleToggle}
      disabled={toggling}
    >
      {toggling ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : isFollowing ? (
        <UserCheck className={iconSize} />
      ) : (
        <UserPlus className={iconSize} />
      )}
      {isFollowing ? t('detail.following') : t('detail.follow')}
    </button>
  );
};

export default FollowButton;
